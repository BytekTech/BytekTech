import { Observable } from 'rxjs';
import { LegalDocument } from '../models/legal.model';

export abstract class LegalRepository {
  abstract getTerms(): Observable<LegalDocument>;
}
