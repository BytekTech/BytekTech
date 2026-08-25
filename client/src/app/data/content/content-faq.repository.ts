import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ContentRepository } from '../../domain/repositories/content.repository';
import { FaqEntry } from '../../domain/models/faq.model';
import { FaqRepository } from '../../domain/repositories/faq.repository';

/** Preguntas publicadas desde el panel. */
@Injectable()
export class ContentFaqRepository extends FaqRepository {
  private readonly content = inject(ContentRepository);

  getFaqs(): Observable<FaqEntry[]> {
    return this.content.getContent().pipe(map((content) => content.faqs));
  }
}
