import { Observable } from 'rxjs';

/**
 * Puerta de entrada al panel. El dominio no sabe de cookies ni de cabeceras:
 * sólo de abrir sesión, cerrarla y preguntar si sigue abierta.
 */
export abstract class AdminSessionGateway {
  abstract login(password: string): Observable<void>;
  abstract logout(): Observable<void>;
  abstract isAuthenticated(): Observable<boolean>;
}
