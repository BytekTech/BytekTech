import { Observable } from 'rxjs';
import { FaqEntry } from '../models/faq.model';

export abstract class FaqRepository {
  abstract getFaqs(): Observable<FaqEntry[]>;
}
