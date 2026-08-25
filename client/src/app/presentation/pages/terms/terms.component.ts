import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../../application/language.service';
import { pathFor } from '../../../application/i18n/site-pages';
import { LegalRepository } from '../../../domain/repositories/legal.repository';
import { LegalDocument } from '../../../domain/models/legal.model';

const EMPTY_TERMS: LegalDocument = { updatedAt: '', clauses: [] };

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  private readonly language = inject(LanguageService);
  private readonly legalRepository = inject(LegalRepository);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly terms = toSignal(this.legalRepository.getTerms(), { initialValue: EMPTY_TERMS });

  readonly homePath = pathFor('home');

  /** La fecha se escribe en el idioma que se está leyendo, no en el del servidor. */
  readonly updatedOn = computed(() => {
    const { updatedAt } = this.terms();
    if (!updatedAt) {
      return '';
    }
    return new Intl.DateTimeFormat(this.lang(), {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(updatedAt));
  });
}
