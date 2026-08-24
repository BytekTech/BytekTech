import { Observable } from 'rxjs';
import { ContactRequest } from '../models/contact.model';

export abstract class ContactGateway {
  abstract send(request: ContactRequest): Observable<void>;
}
