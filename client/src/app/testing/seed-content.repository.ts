import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SiteContent } from '../domain/models/site-content.model';
import { ContentRepository } from '../domain/repositories/content.repository';
import { seedContent } from '../data/content/seed-content';

/** Contenido de fábrica, sin red ni disco: lo que ven los tests. */
@Injectable()
export class SeedContentRepository extends ContentRepository {
  getContent(): Observable<SiteContent> {
    return of(seedContent());
  }
}
