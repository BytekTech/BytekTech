import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Client } from '../../domain/models/client.model';
import { ClientRepository } from '../../domain/repositories/client.repository';
import { CLIENTS } from './clients.data';

@Injectable()
export class StaticClientRepository extends ClientRepository {
  getClients(): Observable<Client[]> {
    return of(CLIENTS);
  }
}
