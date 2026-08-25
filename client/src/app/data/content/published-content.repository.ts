import { inject, Injectable, makeStateKey, REQUEST_CONTEXT, TransferState } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { SiteContent } from '../../domain/models/site-content.model';
import { ContentRepository } from '../../domain/repositories/content.repository';

/** El contenido viaja del servidor al navegador dentro del propio HTML. */
const CONTENT_KEY = makeStateKey<SiteContent>('bytek.content');

/** Lo que el servidor adjunta al pedido cuando renderiza. */
interface RenderContext {
  content?: SiteContent;
}

/**
 * Contenido publicado, resuelto donde convenga en cada lado.
 *
 * Al renderizar en el servidor viene con el pedido, ya leído del almacenamiento:
 * ninguna petición HTTP de la casa hacia sí misma. Al hidratar en el navegador
 * viaja dentro del HTML, así que la primera pintura no espera a la red; sólo se
 * pregunta a `/api/content` si esa transferencia no está —una navegación que
 * arranque en el cliente, o el panel después de guardar.
 */
@Injectable()
export class PublishedContentRepository extends ContentRepository {
  private readonly transferState = inject(TransferState);
  private readonly renderContext = inject(REQUEST_CONTEXT, { optional: true }) as RenderContext | null;
  private readonly http = inject(HttpClient);

  private readonly content$ = this.resolve().pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getContent(): Observable<SiteContent> {
    return this.content$;
  }

  private resolve(): Observable<SiteContent> {
    const transferred = this.transferState.get(CONTENT_KEY, null);
    if (transferred) {
      return of(transferred);
    }

    const fromServer = this.renderContext?.content;
    if (fromServer) {
      this.transferState.set(CONTENT_KEY, fromServer);
      return of(fromServer);
    }

    return this.http.get<SiteContent>('/api/content');
  }
}
