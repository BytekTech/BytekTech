import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ContentRepository } from '../../domain/repositories/content.repository';
import { Service } from '../../domain/models/service.model';
import { ServiceRepository } from '../../domain/repositories/service.repository';

/** Servicios publicados desde el panel. */
@Injectable()
export class ContentServiceRepository extends ServiceRepository {
  private readonly content = inject(ContentRepository);

  getServices(): Observable<Service[]> {
    return this.content.getContent().pipe(map((content) => content.services));
  }
}
