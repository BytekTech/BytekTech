import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { COMPANY_INFO } from '../../../application/company.token';
import { LanguageService } from '../../../application/language.service';
import { pathFor } from '../../../application/i18n/site-pages';
import { NAV_SECTIONS } from '../nav-sections';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly language = inject(LanguageService);

  readonly t = this.language.t;
  readonly company = inject(COMPANY_INFO);
  readonly currentYear = new Date().getFullYear();

  // El footer enlaza las secciones, no el contacto: ese ya es el bloque de arriba.
  readonly sections = NAV_SECTIONS.filter((section) => section.label !== 'contact');
  readonly termsPath = pathFor('terms');

  anchor(fragment: string): string {
    return this.language.anchor(fragment);
  }
}
