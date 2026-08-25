import { LEGACY_TERMS_SLUGS, pageFromUrl, pathFor, routeFor } from './site-pages';

describe('site-pages', () => {
  it('resuelve la ruta de cada página sin idioma en la URL', () => {
    expect(pathFor('home')).toBe('/');
    expect(pathFor('terms')).toBe('/terms');
  });

  it('expone la ruta de Angular sin barra inicial', () => {
    expect(routeFor('terms')).toBe('terms');
  });

  it('reconoce los términos, también en los enlaces viejos con idioma', () => {
    expect(pageFromUrl('/terms')).toBe('terms');
    expect(pageFromUrl('/terms?ref=footer#datos')).toBe('terms');
    for (const slug of LEGACY_TERMS_SLUGS) {
      expect(pageFromUrl(`/${slug}`)).toBe('terms');
    }
  });

  it('trata como home la raíz, las raíces viejas por idioma y cualquier otro segmento', () => {
    expect(pageFromUrl('/')).toBe('home');
    expect(pageFromUrl('/es')).toBe('home');
    expect(pageFromUrl('/en#contacto')).toBe('home');
    expect(pageFromUrl('/otra-cosa')).toBe('home');
  });
});
