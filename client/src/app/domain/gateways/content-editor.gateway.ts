import { Observable } from 'rxjs';
import { ContentSection, SiteContent } from '../models/site-content.model';

/** Publicación del contenido editado, de a una sección. */
export abstract class ContentEditorGateway {
  abstract save<S extends ContentSection>(
    section: S,
    items: SiteContent[S],
  ): Observable<SiteContent[S]>;
}
