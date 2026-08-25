import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ContentRepository } from '../../domain/repositories/content.repository';
import { Client } from '../../domain/models/client.model';
import { ClientRepository } from '../../domain/repositories/client.repository';

/** Clientes publicados desde el panel. */
@Injectable()
export class ContentClientRepository extends ClientRepository {
  private readonly content = inject(ContentRepository);

  getClients(): Observable<Client[]> {
    return this.content.getContent().pipe(map((content) => content.clients));
  }
}
