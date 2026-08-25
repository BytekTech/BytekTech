import {
  afterNextRender,
  computed,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  REQUEST,
  signal,
  TransferState,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import {
  DEFAULT_LANG,
  firstSupportedLang,
  isLang,
  Lang,
  langFromAcceptLanguage,
} from '../domain/models/language.model';
import { APP_TRANSLATIONS } from './translations.token';
import { Page, pageFromUrl } from './i18n/site-pages';

const STORAGE_KEY = 'bytek.lang';

/** Idioma con el que el servidor armó el HTML, para hidratar sin contradecirlo. */
const LANG_KEY = makeStateKey<Lang>('bytek.lang');

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly translations = inject(APP_TRANSLATIONS);
  private readonly router = inject(Router);
  private readonly transferState = inject(TransferState);
  private readonly request = inject(REQUEST, { optional: true });

  /**
   * El idioma es una preferencia de quien lee, no un tramo de la URL: la misma
   * dirección sirve el sitio en los dos idiomas. El servidor elige el primero
   * según la cabecera del navegador y, ya hidratada la página, manda lo que el
   * visitante haya elegido antes.
   */
  private readonly current = signal<Lang>(this.initialLang());

  readonly lang = this.current.asReadonly();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly page = computed<Page>(() => pageFromUrl(this.url()));

  readonly t = computed(() => this.translations[this.lang()]);

  constructor() {
    if (!this.isBrowser) {
      this.transferState.set(LANG_KEY, this.current());
    }

    // Recién después de hidratar: cambiar el idioma antes contradiría al HTML
    // servido y Angular tendría que rehacer lo que el navegador ya pintó.
    afterNextRender(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLang(saved) && saved !== this.current()) {
        this.current.set(saved);
      }
    });

    effect(() => {
      const lang = this.lang();
      this.document.documentElement.lang = lang;
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    });
  }

  set(lang: Lang): void {
    this.current.set(lang);
  }

  /**
   * Enlace a una sección del one-page. Desde el propio home es un ancla pelada,
   * y así el navegador se desplaza suave sin recargar nada; desde otra página
   * necesita la raíz adelante para volver primero al home.
   */
  anchor(fragment: string): string {
    return this.page() === 'home' ? `#${fragment}` : `/#${fragment}`;
  }

  /** Idioma del visitante: su elección previa, si no la cabecera del navegador. */
  private initialLang(): Lang {
    if (this.isBrowser) {
      return this.transferState.get(LANG_KEY, browserLang());
    }
    const header = this.request?.headers.get('accept-language') ?? '';
    return langFromAcceptLanguage(header) ?? DEFAULT_LANG;
  }
}

/** Preferencia guardada, o la del navegador, o el idioma de la casa. */
function browserLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) {
      return saved;
    }
  }
  if (typeof navigator !== 'undefined') {
    return firstSupportedLang(navigator.languages ?? [navigator.language]) ?? DEFAULT_LANG;
  }
  return DEFAULT_LANG;
}
