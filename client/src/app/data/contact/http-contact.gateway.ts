import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactRequest } from '../../domain/models/contact.model';
import { ContactGateway } from '../../domain/gateways/contact.gateway';

@Injectable()
export class HttpContactGateway extends ContactGateway {
  private readonly http = inject(HttpClient);

  send(request: ContactRequest): Observable<void> {
    return this.http.post<void>('/api/contact', request);
  }
}
