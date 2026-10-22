import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';
import { LEGACY_HOME_SLUGS, LEGACY_TERMS_SLUGS, routeFor } from './application/i18n/site-pages';

describe('serverRoutes', () => {
  const statusOf = (path: string) => serverRoutes.find((route) => route.path === path);

  it('marca como mudanza permanente cada dirección vieja', () => {
    const legacy = [
      ...LEGACY_TERMS_SLUGS.filter((slug) => slug !== routeFor('terms')),
      ...LEGACY_HOME_SLUGS,
    ];

    for (const path of legacy) {
      expect(statusOf(path)).toEqual(
        jasmine.objectContaining({ renderMode: RenderMode.Server, status: 301 }),
      );
    }
  });

  it('no le pone estado propio a la página de términos vigente', () => {
    expect(statusOf(routeFor('terms'))).toBeUndefined();
  });

  it('deja el resto renderizándose por pedido, al final', () => {
    expect(serverRoutes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Server });
  });
});
