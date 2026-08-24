import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FaqEntry } from '../../domain/models/faq.model';
import { FaqRepository } from '../../domain/repositories/faq.repository';
import { FAQS } from './faq.data';

@Injectable()
export class StaticFaqRepository extends FaqRepository {
  getFaqs(): Observable<FaqEntry[]> {
    return of(FAQS);
  }
}
