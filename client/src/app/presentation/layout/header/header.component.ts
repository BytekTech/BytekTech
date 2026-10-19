import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Lang } from '../../../domain/models/language.model';
import { LanguageService } from '../../../application/language.service';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';
import { NAV_SECTIONS } from '../nav-sections';

@Component({
  selector: 'app-header',
  imports: [ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class HeaderComponent {
  private readonly language = inject(LanguageService);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly isMenuOpen = signal(false);
  readonly sections = NAV_SECTIONS;

  /** Enlace a una sección del home, válido también desde otra página. */
  anchor(fragment: string): string {
    return this.language.anchor(fragment);
  }

  setLang(lang: Lang): void {
    this.language.set(lang);
    this.closeMenu();
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
