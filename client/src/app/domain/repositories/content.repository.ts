import { Observable } from 'rxjs';
import { SiteContent } from '../models/site-content.model';

/**
 * Lectura del contenido publicado. Quién lo guarda —un archivo, una base— es
 * asunto de la infraestructura: el sitio sólo sabe pedirlo.
 */
export abstract class ContentRepository {
  abstract getContent(): Observable<SiteContent>;
}
