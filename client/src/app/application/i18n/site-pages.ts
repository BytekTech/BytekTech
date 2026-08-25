/**
 * Páginas con ruta propia. El idioma ya no viaja en la URL: una sola dirección
 * sirve el sitio en el idioma que elija quien lo visita, así un enlace
 * compartido lleva siempre a la misma página sin arrastrar el idioma de quien
 * lo mandó.
 */
export type Page = 'home' | 'terms';

export type SubPage = Exclude<Page, 'home'>;

/** Ruta de Angular, sin barra inicial: 'terms'. */
const ROUTES: Record<SubPage, string> = {
  terms: 'terms',
};

/** Rutas viejas, con el idioma adentro, que siguen llegando desde enlaces ya publicados. */
export const LEGACY_TERMS_SLUGS: readonly string[] = [
  'terminos',
  'es/terminos',
  'es/terms',
  'en/terms',
  'en/terminos',
];

export function routeFor(page: SubPage): string {
  return ROUTES[page];
}

/** Ruta absoluta dentro del sitio: '/', '/terms'. */
export function pathFor(page: Page): string {
  return page === 'home' ? '/' : `/${ROUTES[page]}`;
}

/**
 * Página que codifica una URL. Se compara la ruta entera y no el primer
 * segmento: '/es' es el home de un enlace viejo, no la página de términos.
 */
export function pageFromUrl(url: string): Page {
  const [path] = url.split(/[?#]/);
  const route = path.split('/').filter(Boolean).join('/');
  return route === ROUTES.terms || LEGACY_TERMS_SLUGS.includes(route) ? 'terms' : 'home';
}
