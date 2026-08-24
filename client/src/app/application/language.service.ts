import { computed, DOCUMENT, effect, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import {
  DEFAULT_LANG,
  firstSupportedLang,
  isLang,
  Lang,
} from '../domain/models/language.model';
import { APP_TRANSLATIONS } from './translations.token';
import { langFromUrl } from './i18n/lang-from-url';

const STORAGE_KEY = 'bytek.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly translations = inject(APP_TRANSLATIONS);
  private readonly router = inject(Router);

  /**
   * La URL es la única fuente de verdad del idioma: cada idioma tiene su ruta
   * ('/es', '/en') y por lo tanto su HTML prerenderizado, indexable y compartible.
   */
  readonly lang = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => langFromUrl(event.urlAfterRedirects)),
    ),
    { initialValue: langFromUrl(this.router.url) },
  );

  readonly t = computed(() => this.translations[this.lang()]);

  constructor() {
    effect(() => {
      const lang = this.lang();
      this.document.documentElement.lang = lang;
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    });
  }

  /** Navega al mismo contenido en otro idioma, conservando el ancla actual. */
  set(lang: Lang): void {
    if (lang === this.lang()) {
      return;
    }
    this.router.navigate(['/', lang], { preserveFragment: true });
  }

  /** Ruta equivalente a la actual en el idioma indicado, para los enlaces hreflang. */
  pathFor(lang: Lang): string {
    return `/${lang}`;
  }
}

/**
 * Idioma preferido del visitante cuando entra a '/' sin especificar uno.
 * Prioriza su elección previa por encima de la configuración del navegador.
 */
export function preferredLang(): Lang {
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
