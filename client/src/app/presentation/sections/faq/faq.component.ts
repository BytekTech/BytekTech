import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FaqRepository } from '../../../domain/repositories/faq.repository';
import { LanguageService } from '../../../application/language.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  private readonly language = inject(LanguageService);
  private readonly faqRepository = inject(FaqRepository);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  // La misma fuente que alimenta al asistente: una sola verdad para las respuestas.
  readonly faqs = toSignal(this.faqRepository.getFaqs(), { initialValue: [] });
}
