import { Observable } from 'rxjs';
import { Client } from '../models/client.model';

export abstract class ClientRepository {
  abstract getClients(): Observable<Client[]>;
}
