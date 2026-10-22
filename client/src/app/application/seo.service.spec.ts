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

  it('describe la imagen social con su texto, sus medidas y su tipo', async () => {
    await router.navigateByUrl('/');
    language.set('en');
    TestBed.tick();

    expect(head('meta[property="og:image"]')?.getAttribute('content')).toBe(
      `${COMPANY.siteUrl}/og-image-en.png`,
    );
    expect(head('meta[property="og:image:width"]')?.getAttribute('content')).toBe('1200');
    expect(head('meta[property="og:image:height"]')?.getAttribute('content')).toBe('630');
    expect(head('meta[property="og:image:type"]')?.getAttribute('content')).toBe('image/png');
    expect(head('meta[property="og:image:alt"]')?.getAttribute('content')).toContain(
      'Custom software engineering',
    );
    expect(head('meta[name="twitter:image:alt"]')?.getAttribute('content')).toContain(
      'Custom software engineering',
    );
  });

  it('declara el otro idioma como alternativa, una sola vez aunque se cambie varias', async () => {
    await router.navigateByUrl('/');
    language.set('en');
    TestBed.tick();
    language.set('es');
    TestBed.tick();

    const alternates = Array.from(
      document.head.querySelectorAll('meta[property="og:locale:alternate"]'),
    ).map((tag) => tag.getAttribute('content'));
    expect(alternates).toEqual(['en_US']);
  });

  it('el sitio de los datos estructurados es la raíz, también desde los términos', async () => {
    await router.navigateByUrl('/terms');
    TestBed.tick();
    const graph = JSON.parse(document.getElementById('bytek-json-ld')?.textContent ?? '{}');
    const nodeOf = (type: string) =>
      graph['@graph'].find((node: { '@type': string }) => node['@type'] === type);

    expect(nodeOf('WebSite').url).toBe(`${COMPANY.siteUrl}/`);
    expect(nodeOf('WebPage').url).toBe(`${COMPANY.siteUrl}/terms`);
    expect(nodeOf('WebPage').name).toBe(document.title);
    expect(nodeOf('WebPage').isPartOf['@id']).toBe(nodeOf('WebSite')['@id']);
  });

  it('una dirección que no existe no se indexa ni declara canonical', async () => {
    await router.navigateByUrl('/no-existe');
    language.set('es');
    TestBed.tick();

    expect(head('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
    expect(head('link[rel="canonical"]')).toBeNull();
    expect(head('meta[property="og:url"]')).toBeNull();
    expect(document.title).toContain('no encontrada');
  });

  it('al volver a una página real se indexa de nuevo', async () => {
    await router.navigateByUrl('/no-existe');
    TestBed.tick();
    await router.navigateByUrl('/');
    TestBed.tick();

    expect(head('meta[name="robots"]')).toBeNull();
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${COMPANY.siteUrl}/`);
  });

  it('el panel no se indexa y no lleva datos estructurados', async () => {
    await router.navigateByUrl('/admin');
    TestBed.tick();

    expect(head('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
    expect(head('link[rel="canonical"]')).toBeNull();
    expect(document.getElementById('bytek-json-ld')).toBeNull();
  });

  it('el home publica los servicios y las preguntas frecuentes del contenido', async () => {
    await router.navigateByUrl('/');
    TestBed.tick();
    const graph = JSON.parse(document.getElementById('bytek-json-ld')?.textContent ?? '{}');
    const types = graph['@graph'].map((node: { '@type': unknown }) => node['@type']);
    const organization = graph['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'Organization',
    );

    expect(types).toContain(['WebPage', 'FAQPage']);
    expect(organization.hasOfferCatalog.itemListElement.length).toBeGreaterThan(0);
  });
});
