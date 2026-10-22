import { RenderMode, ServerRoute } from '@angular/ssr';
import { LEGACY_HOME_SLUGS, LEGACY_TERMS_SLUGS, routeFor } from './application/i18n/site-pages';

/**
 * Direcciones viejas, con el idioma adentro, que ya redirigen en `app.routes`.
 * Acá se las marca como mudanza permanente: con el 302 por defecto el buscador
 * las sigue tratando como páginas aparte y no le pasa su peso a la nueva.
 */
const MOVED_PERMANENTLY: readonly string[] = [
  ...LEGACY_TERMS_SLUGS.filter((slug) => slug !== routeFor('terms')),
  ...LEGACY_HOME_SLUGS,
];

/**
 * Todo se renderiza por pedido. Ya no hay una copia congelada por idioma: el
 * idioma sale de la cabecera del visitante y el contenido lo edita el panel,
 * y ninguna de las dos cosas se puede decidir en tiempo de compilación. El
 * 404 de las direcciones que no existen lo pone su propia página al renderizar.
 */
export const serverRoutes: ServerRoute[] = [
  ...MOVED_PERMANENTLY.map((path) => ({ path, renderMode: RenderMode.Server, status: 301 }) as const),
  { path: '**', renderMode: RenderMode.Server },
];
