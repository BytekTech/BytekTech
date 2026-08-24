import { DOCUMENT, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DEFAULT_THEME, oppositeTheme, Theme } from '../domain/models/theme.model';
import { resolveTheme } from './theme/resolve-theme';

export const THEME_STORAGE_KEY = 'bytek.theme';

const TRANSITION_CLASS = 'theme-transition';
/** Debe cubrir la duración declarada en styles.scss, con margen para el repintado. */
const TRANSITION_MS = 400;

const BACKGROUND_BY_THEME: Record<Theme, string> = {
  light: '#f7f7f8',
  dark: '#0b0c0e',
};

/**
 * Tema activo del sitio. El HTML se prerenderiza sin tema para que los dos
 * sirvan el mismo archivo; la preferencia del sistema la resuelve el CSS y la
 * elección del visitante se aplica sobre <html data-theme>, primero mediante
 * el script de arranque de index.html (para que no haya destello) y después
 * desde acá.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>(DEFAULT_THEME);

  /** El tema que ya venía aplicado al cargar no se cruza: sólo los cambios. */
  private isFirstApply = true;
  private transitionTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (this.isBrowser) {
      this.theme.set(resolveTheme(localStorage.getItem(THEME_STORAGE_KEY), this.prefersDark()));
      effect(() => this.apply(this.theme()));
    }
  }

  toggle(): void {
    this.theme.update(oppositeTheme);
  }

  set(theme: Theme): void {
    this.theme.set(theme);
  }

  private prefersDark(): boolean {
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  private apply(theme: Theme): void {
    const root = this.document.documentElement;

    if (this.isFirstApply) {
      this.isFirstApply = false;
    } else {
      this.startTransition(root);
    }

    root.dataset['theme'] = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // La barra del navegador en móvil acompaña al fondo de la página.
    this.document.head
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', BACKGROUND_BY_THEME[theme]);
  }

  /**
   * Habilita el cruce de colores y lo retira al terminar. El reflow forzado no
   * es decorativo: sin él el navegador aplica la clase y el nuevo tema en el
   * mismo recálculo, no encuentra un valor previo desde el cual interpolar y
   * el cambio salta de golpe.
   */
  private startTransition(root: HTMLElement): void {
    root.classList.add(TRANSITION_CLASS);
    void root.offsetWidth;

    clearTimeout(this.transitionTimer);
    this.transitionTimer = setTimeout(
      () => root.classList.remove(TRANSITION_CLASS),
      TRANSITION_MS,
    );
  }
}
