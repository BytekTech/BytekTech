import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { COMPANY_INFO } from '../../../application/company.token';
import { LanguageService } from '../../../application/language.service';

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
}
