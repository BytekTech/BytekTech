import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Lang, SUPPORTED_LANGS } from '../domain/models/language.model';
import { ContentRepository } from '../domain/repositories/content.repository';
import { COMPANY_INFO } from './company.token';
import { LanguageService } from './language.service';
import { IndexablePage, isIndexable, Page, pathFor } from './i18n/site-pages';
import { buildStructuredData, IndexedPage, serializeForScript } from './seo/structured-data';

const OG_IMAGE_BY_LANG: Record<Lang, string> = {
  es: '/og-image.png',
  en: '/og-image-en.png',
};

/** Medidas reales de las dos imágenes: con ellas la tarjeta se arma sin esperar a descargarla. */
const OG_IMAGE_SIZE = { width: '1200', height: '630' };

const OG_LOCALE_BY_LANG: Record<Lang, string> = {
  es: 'es_AR',
  en: 'en_US',
};

const NOINDEX = 'noindex, nofollow';

interface PageMeta {
  title: string;
  description: string;
}

const JSON_LD_ID = 'bytek-json-ld';


/**
 * Mantiene sincronizada la metadata con la página y el idioma activos: título,
 * descripción, canonical, tarjetas sociales y datos estructurados. Corre
 * también en el servidor, así el HTML sale con su metadata ya resuelta.
 *
 * Sólo el home y los términos se indexan. La página de "no existe" y el panel
 * se marcan para que no entren al buscador y no declaran dirección canónica.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly language = inject(LanguageService);
  private readonly company = inject(COMPANY_INFO);
  private readonly content = toSignal(inject(ContentRepository).getContent(), {
    initialValue: null,
  });

  /** Cada página lleva su propio título y descripción. */
  private readonly pageMeta = computed<PageMeta>(() => {
    const translations = this.language.t();
    switch (this.language.page()) {
      case 'terms':
        return translations.terms.meta;
      case 'notFound':
        return translations.notFound.meta;
      default:
        return translations.meta;
    }
  });

  constructor() {
    effect(() => {
      const page = this.language.page();
      // El panel es la trastienda: pone su propio título y sólo hace falta
      // que no se indexe.
      if (page === 'admin') {
        this.hideFromSearch();
        this.removeJsonLd();
        return;
      }
      this.apply(page, this.language.lang(), this.pageMeta());
    });
  }

  private apply(page: Exclude<Page, 'admin'>, lang: Lang, meta: PageMeta): void {
    this.title.setTitle(meta.title);
    this.meta.updateTag({ name: 'description', content: meta.description });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.company.name });
    this.meta.updateTag({ property: 'og:title', content: meta.title });
    this.meta.updateTag({ property: 'og:description', content: meta.description });
    this.setOpenGraphLocales(lang);
    this.setShareImage(lang, this.language.t().meta.imageAlt);

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: meta.title });
    this.meta.updateTag({ name: 'twitter:description', content: meta.description });

    const indexed = isIndexable(page) ? this.indexedPage(page, meta) : null;
    if (indexed) {
      this.exposeToSearch(indexed.url);
    } else {
      this.hideFromSearch();
    }
    this.setJsonLd(lang, indexed);
  }

  private indexedPage(page: IndexablePage, meta: PageMeta): IndexedPage {
    return {
      url: `${this.company.siteUrl}${pathFor(page)}`,
      title: meta.title,
      description: meta.description,
      isHome: page === 'home',
    };
  }

  /**
   * Sin idioma en la URL hay una sola dirección por página: no existen
   * versiones alternas que declarar con hreflang.
   */
  private exposeToSearch(url: string): void {
    this.meta.removeTag('name="robots"');
    this.meta.updateTag({ property: 'og:url', content: url });
    this.setCanonical(url);
  }

  /** Una página que no se indexa no tiene dirección canónica que declarar. */
  private hideFromSearch(): void {
    this.meta.updateTag({ name: 'robots', content: NOINDEX });
    this.meta.removeTag('property="og:url"');
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }

  /** El idioma servido, y el otro como alternativa de la misma dirección. */
  private setOpenGraphLocales(lang: Lang): void {
    this.meta.updateTag({ property: 'og:locale', content: OG_LOCALE_BY_LANG[lang] });
    this.meta.removeTag('property="og:locale:alternate"');
    for (const other of SUPPORTED_LANGS.filter((candidate) => candidate !== lang)) {
      this.meta.addTag({ property: 'og:locale:alternate', content: OG_LOCALE_BY_LANG[other] });
    }
  }

  private setShareImage(lang: Lang, alt: string): void {
    const image = `${this.company.siteUrl}${OG_IMAGE_BY_LANG[lang]}`;

    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/png' });
    this.meta.updateTag({ property: 'og:image:width', content: OG_IMAGE_SIZE.width });
    this.meta.updateTag({ property: 'og:image:height', content: OG_IMAGE_SIZE.height });
    this.meta.updateTag({ property: 'og:image:alt', content: alt });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: alt });
  }

  private setCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(lang: Lang, page: IndexedPage | null): void {
    const graph = buildStructuredData({
      company: this.company,
      lang,
      summary: this.language.t().meta.description,
      page,
      content: this.content(),
    });

    let script = this.document.getElementById(JSON_LD_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.id = JSON_LD_ID;
      this.document.head.appendChild(script);
    }
    script.textContent = serializeForScript(graph);
  }

  private removeJsonLd(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
  }
}
