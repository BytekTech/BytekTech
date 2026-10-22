/**
 * Páginas del sitio. El idioma ya no viaja en la URL: una sola dirección
 * sirve el sitio en el idioma que elija quien lo visita, así un enlace
 * compartido lleva siempre a la misma página sin arrastrar el idioma de quien
 * lo mandó.
 *
 * `notFound` no tiene dirección propia: es lo que responde cualquier dirección
 * que no existe.
 */
export type Page = 'home' | 'terms' | 'admin' | 'notFound';

/** Páginas con ruta propia además del home. */
export type SubPage = 'terms' | 'admin';

/** Páginas que un buscador tiene que indexar: las únicas con dirección canónica. */
export type IndexablePage = 'home' | 'terms';

/** Ruta de Angular, sin barra inicial: 'terms'. */
const ROUTES: Record<SubPage, string> = {
  terms: 'terms',
  admin: 'admin',
};

/** Rutas viejas, con el idioma adentro, que siguen llegando desde enlaces ya publicados. */
export const LEGACY_TERMS_SLUGS: readonly string[] = [
  'terminos',
  'es/terminos',
  'es/terms',
  'en/terms',
  'en/terminos',
];

/** Raíces viejas por idioma: redirigen al home. */
export const LEGACY_HOME_SLUGS: readonly string[] = ['es', 'en'];

export function routeFor(page: SubPage): string {
  return ROUTES[page];
}

/** Ruta absoluta dentro del sitio: '/', '/terms'. */
export function pathFor(page: 'home' | SubPage): string {
  return page === 'home' ? '/' : `/${ROUTES[page]}`;
}

export function isIndexable(page: Page): page is IndexablePage {
  return page === 'home' || page === 'terms';
}

/**
 * Página que codifica una URL. Se compara la ruta entera y no el primer
 * segmento: '/es' es el home de un enlace viejo, no la página de términos, y
 * '/terms/algo' no existe.
 */
export function pageFromUrl(url: string): Page {
  const [path] = url.split(/[?#]/);
  const route = path.split('/').filter(Boolean).join('/');

  if (route === '' || LEGACY_HOME_SLUGS.includes(route)) {
    return 'home';
  }
  if (route === ROUTES.terms || LEGACY_TERMS_SLUGS.includes(route)) {
    return 'terms';
  }
  if (route === ROUTES.admin) {
    return 'admin';
  }
  return 'notFound';
}
