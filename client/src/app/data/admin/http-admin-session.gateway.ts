import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { AdminSessionGateway } from '../../domain/gateways/admin-session.gateway';

/**
 * La sesión vive en una cookie HttpOnly que pone el servidor: el navegador la
 * manda sola y ningún script de la página —ni este— puede leerla.
 */
@Injectable()
export class HttpAdminSessionGateway extends AdminSessionGateway {
  private readonly http = inject(HttpClient);

  login(password: string): Observable<void> {
    return this.http.post<void>('/api/admin/login', { password });
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/admin/logout', {});
  }

  isAuthenticated(): Observable<boolean> {
    return this.http.get<{ authenticated: boolean }>('/api/admin/session').pipe(
      map((response) => response.authenticated),
      catchError(() => of(false)),
    );
  }
}
