import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { PublishedContentRepository } from './published-content.repository';
import { ContentRepository } from '../../domain/repositories/content.repository';
import { seedContent } from './seed-content';
import { SiteContent } from '../../domain/models/site-content.model';

describe('PublishedContentRepository', () => {
  let repository: ContentRepository;
  let http: HttpTestingController;

  /** El contenido de fábrica con una sección cambiada, como tras publicar. */
  function contentWithFirstClientNamed(name: string): SiteContent {
    const content = seedContent();
    return { ...content, clients: [{ ...content.clients[0], name }, ...content.clients.slice(1)] };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContentRepository, useClass: PublishedContentRepository },
      ],
    });
    repository = TestBed.inject(ContentRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lee el contenido publicado una sola vez y lo reparte', async () => {
    const first = firstValueFrom(repository.getContent());
    http.expectOne('/api/content').flush(seedContent());
    await first;

    // La segunda sección que lo pide no vuelve a la red: comparten la lectura.
    const again = await firstValueFrom(repository.getContent());

    expect(again.clients.length).toBe(seedContent().clients.length);
    expect(http.match('/api/content').length).toBe(0);
  });

  it('vuelve a la fuente después de publicar', async () => {
    const first = firstValueFrom(repository.getContent());
    http.expectOne('/api/content').flush(seedContent());
    await first;

    repository.refresh();
    http.expectOne('/api/content').flush(contentWithFirstClientNamed('Recién publicado'));

    const reloaded = await firstValueFrom(repository.getContent());
    expect(reloaded.clients[0].name).toBe('Recién publicado');
  });
});
