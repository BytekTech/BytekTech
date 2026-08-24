import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { routes } from '../app.routes';
import { COMPANY } from '../data/company/company.data';
import { contentProviders } from '../testing/test-providers';
import { SeoService } from './seo.service';

function head(selector: string): Element | null {
  return document.head.querySelector(selector);
}

describe('SeoService', () => {
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideLocationMocks(),
        ...contentProviders,
      ],
    });
    router = TestBed.inject(Router);
    TestBed.inject(SeoService);
  });

  it('apunta el canonical a la URL del idioma activo', async () => {
    await router.navigateByUrl('/en');
    TestBed.tick();

    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${COMPANY.siteUrl}/en`);
  });

  it('declara ambos idiomas como alternativas, con el español por defecto', async () => {
    await router.navigateByUrl('/es');
    TestBed.tick();

    expect(head('link[rel="alternate"][hreflang="es"]')?.getAttribute('href')).toBe(
      `${COMPANY.siteUrl}/es`,
    );
    expect(head('link[rel="alternate"][hreflang="en"]')?.getAttribute('href')).toBe(
      `${COMPANY.siteUrl}/en`,
    );
    expect(head('link[rel="alternate"][hreflang="x-default"]')?.getAttribute('href')).toBe(
      `${COMPANY.siteUrl}/es`,
    );
  });

  it('traduce título y descripción al cambiar de idioma', async () => {
    await router.navigateByUrl('/es');
    TestBed.tick();
    const spanishTitle = document.title;

    await router.navigateByUrl('/en');
    TestBed.tick();

    expect(document.title).not.toBe(spanishTitle);
    expect(head('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    expect(head('meta[property="og:url"]')?.getAttribute('content')).toBe(`${COMPANY.siteUrl}/en`);
  });

  it('publica los datos estructurados de la organización', async () => {
    await router.navigateByUrl('/es');
    TestBed.tick();
    const script = document.getElementById('bytek-json-ld');
    const graph = JSON.parse(script?.textContent ?? '{}');

    const organization = graph['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'Organization',
    );
    expect(organization.name).toBe(COMPANY.name);
    expect(organization.sameAs).toEqual(COMPANY.social.map((link) => link.url));
  });
});
