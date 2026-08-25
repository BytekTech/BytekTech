import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LegalDocument } from '../../domain/models/legal.model';
import { LegalRepository } from '../../domain/repositories/legal.repository';
import { TERMS } from './terms.data';

@Injectable()
export class StaticLegalRepository extends LegalRepository {
  getTerms(): Observable<LegalDocument> {
    return of(TERMS);
  }
}
