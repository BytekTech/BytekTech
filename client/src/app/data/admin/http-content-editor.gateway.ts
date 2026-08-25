import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ContentSection, SiteContent } from '../../domain/models/site-content.model';
import { ContentEditorGateway } from '../../domain/gateways/content-editor.gateway';

@Injectable()
export class HttpContentEditorGateway extends ContentEditorGateway {
  private readonly http = inject(HttpClient);

  save<S extends ContentSection>(section: S, items: SiteContent[S]): Observable<SiteContent[S]> {
    return this.http
      .put<{ items: SiteContent[S] }>(`/api/content/${section}`, { items })
      .pipe(map((response) => response.items));
  }
}
