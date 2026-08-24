import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Lang } from '../../../domain/models/language.model';
import { LanguageService } from '../../../application/language.service';
import { ThemeService } from '../../../application/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class HeaderComponent {
  private readonly language = inject(LanguageService);
  private readonly themeService = inject(ThemeService);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly theme = this.themeService.theme;
  readonly isMenuOpen = signal(false);

  /** El botón anuncia adónde lleva, no dónde está: es una acción, no un estado. */
  readonly themeActionLabel = computed(() =>
    this.theme() === 'dark' ? this.t().theme.toLight : this.t().theme.toDark,
  );

  setLang(lang: Lang): void {
    this.language.set(lang);
    this.closeMenu();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
