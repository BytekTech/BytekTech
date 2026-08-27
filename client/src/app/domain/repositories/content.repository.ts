import { Observable } from 'rxjs';
import { SiteContent } from '../models/site-content.model';

/**
 * Lectura del contenido publicado. Quién lo guarda —un archivo, una base— es
 * asunto de la infraestructura: el sitio sólo sabe pedirlo.
 */
export abstract class ContentRepository {
  abstract getContent(): Observable<SiteContent>;

  /**
   * Descarta lo ya leído y vuelve a la fuente. Lo llama quien acaba de publicar:
   * sin esto el sitio sigue mostrando lo viejo hasta que alguien recargue la
   * página entera. Una fuente que no cambia puede ignorarlo.
   */
  refresh(): void {}
}
