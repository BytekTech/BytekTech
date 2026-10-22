import { isIndexable, LEGACY_TERMS_SLUGS, pageFromUrl, pathFor, routeFor } from './site-pages';

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

  it('trata como home la raíz y las raíces viejas por idioma', () => {
    expect(pageFromUrl('/')).toBe('home');
    expect(pageFromUrl('/#contacto')).toBe('home');
    expect(pageFromUrl('/es')).toBe('home');
    expect(pageFromUrl('/en#contacto')).toBe('home');
  });

  it('reconoce el panel', () => {
    expect(pageFromUrl('/admin')).toBe('admin');
  });

  it('cualquier otra dirección es una página que no existe', () => {
    expect(pageFromUrl('/otra-cosa')).toBe('notFound');
    expect(pageFromUrl('/terms/vieja')).toBe('notFound');
    expect(pageFromUrl('/admin/algo')).toBe('notFound');
  });

  it('sólo el home y los términos se indexan', () => {
    expect(isIndexable('home')).toBeTrue();
    expect(isIndexable('terms')).toBeTrue();
    expect(isIndexable('admin')).toBeFalse();
    expect(isIndexable('notFound')).toBeFalse();
  });
});
