import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { routes } from '../app.routes';
import { COMPANY } from '../data/company/company.data';
import { contentProviders } from '../testing/test-providers';
import { LanguageService } from './language.service';
import { SeoService } from './seo.service';

function head(selector: string): Element | null {
  return document.head.querySelector(selector);
}

describe('SeoService', () => {
  let router: Router;
  let language: LanguageService;

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
    language = TestBed.inject(LanguageService);
    TestBed.inject(SeoService);
  });

  it('apunta el canonical a la URL de la página, sin idioma', async () => {
    await router.navigateByUrl('/');
    TestBed.tick();

    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${COMPANY.siteUrl}/`);
  });

  it('lleva el canonical a los términos cuando esa es la página', async () => {
    await router.navigateByUrl('/terms');
    TestBed.tick();

    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${COMPANY.siteUrl}/terms`);
  });

  it('no declara alternativas hreflang: cada página tiene una sola URL', async () => {
    await router.navigateByUrl('/');
    TestBed.tick();

    expect(head('link[rel="alternate"][hreflang="es"]')).toBeNull();
    expect(head('link[rel="alternate"][hreflang="en"]')).toBeNull();
    expect(head('link[rel="alternate"][hreflang="x-default"]')).toBeNull();
  });

  it('traduce título y descripción al cambiar de idioma', async () => {
    await router.navigateByUrl('/');
    language.set('es');
    TestBed.tick();
    const spanishTitle = document.title;

    language.set('en');
    TestBed.tick();

    expect(document.title).not.toBe(spanishTitle);
    expect(head('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    expect(head('meta[property="og:url"]')?.getAttribute('content')).toBe(`${COMPANY.siteUrl}/`);
  });

  it('publica los datos estructurados de la organización', async () => {
    await router.navigateByUrl('/');
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
