import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Lang, SUPPORTED_LANGS } from '../domain/models/language.model';
import { COMPANY_INFO } from './company.token';
import { LanguageService } from './language.service';
import { pathFor } from './i18n/site-pages';

const OG_IMAGE_BY_LANG: Record<Lang, string> = {
  es: '/og-image.png',
  en: '/og-image-en.png',
};

const OG_LOCALE_BY_LANG: Record<Lang, string> = {
  es: 'es_AR',
  en: 'en_US',
};

const JSON_LD_ID = 'bytek-json-ld';

/**
 * Mantiene sincronizada la metadata indexable con el idioma activo: título,
 * descripción, canonical, tarjetas sociales y datos estructurados. Corre
 * también en el servidor, así el HTML sale con su metadata ya resuelta.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly language = inject(LanguageService);
  private readonly company = inject(COMPANY_INFO);

  /** Cada página lleva su propio título y descripción indexables. */
  private readonly pageMeta = computed(() => {
    const translations = this.language.t();
    return this.language.page() === 'terms' ? translations.terms.meta : translations.meta;
  });

  constructor() {
    effect(() => this.apply(this.language.lang(), this.pageMeta()));
  }

  private apply(lang: Lang, meta: { title: string; description: string }): void {
    const url = this.url();
    const image = `${this.company.siteUrl}${OG_IMAGE_BY_LANG[lang]}`;

    this.title.setTitle(meta.title);
    this.meta.updateTag({ name: 'description', content: meta.description });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.company.name });
    this.meta.updateTag({ property: 'og:title', content: meta.title });
    this.meta.updateTag({ property: 'og:description', content: meta.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: OG_LOCALE_BY_LANG[lang] });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: meta.title });
    this.meta.updateTag({ name: 'twitter:description', content: meta.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    // Sin idioma en la URL hay una sola dirección por página: no existen
    // versiones alternas que declarar con hreflang.
    this.setLink('canonical', url);

    this.setJsonLd(url, meta.description);
  }

  private url(): string {
    return `${this.company.siteUrl}${pathFor(this.language.page())}`;
  }

  /** Crea o actualiza un <link> del head, identificándolo por rel + hreflang. */
  private setLink(rel: string, href: string, hreflang?: string): void {
    const selector = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]:not([hreflang])`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      if (hreflang) {
        link.setAttribute('hreflang', hreflang);
      }
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(url: string, description: string): void {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${this.company.siteUrl}#organization`,
          name: this.company.name,
          legalName: this.company.legalName,
          url: this.company.siteUrl,
          email: this.company.email,
          logo: `${this.company.siteUrl}/apple-touch-icon.png`,
          foundingDate: String(this.company.foundedYear),
          sameAs: this.company.social.map((link) => link.url),
        },
        {
          '@type': 'WebSite',
          '@id': `${this.company.siteUrl}#website`,
          url,
          name: this.company.name,
          description,
          publisher: { '@id': `${this.company.siteUrl}#organization` },
          inLanguage: SUPPORTED_LANGS,
        },
      ],
    };

    let script = this.document.getElementById(JSON_LD_ID);
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.id = JSON_LD_ID;
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(graph);
  }
}
