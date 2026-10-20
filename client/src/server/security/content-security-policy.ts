/**
 * Política de seguridad de contenido (CSP) sin `'unsafe-inline'` para scripts.
 *
 * Un script en línea sólo corre si el servidor lo avaló, de una de dos formas:
 *
 * - **Nonce por pedido**, para lo que arma Angular al renderizar (el script que
 *   reproduce los eventos de antes de hidratar). Angular se lo pone porque lo
 *   recibe como `CSP_NONCE`.
 * - **Hash**, para lo que es igual en todas las páginas: los scripts del
 *   template (`index.html`) y el cargador de estilos que agrega el inlining de
 *   CSS crítico. Se calculan una vez, al arrancar, a partir del template ya
 *   compilado: si alguien edita el script del tema, el hash lo acompaña solo.
 *
 * Lo que un atacante lograra meter en el HTML no tiene ni el nonce, que cambia
 * en cada pedido, ni un hash avalado: el navegador no lo ejecuta.
 */

/**
 * El cargador que deja Beasties al final del `<body>` para pasar las hojas de
 * estilo diferidas a `media` real. Es texto fijo de la librería: si una versión
 * nueva lo cambia, el síntoma es que los estilos no críticos no cargan, y la
 * consola del navegador nombra la CSP. Hay que copiar el texto nuevo acá.
 */
export const CRITICAL_CSS_LOADER =
  "document.querySelectorAll('link[data-beasties-media]').forEach(function(l){l.media=l.getAttribute('data-beasties-media');l.removeAttribute('data-beasties-media')})";

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const SRC_ATTRIBUTE = /\ssrc\s*=/i;
const TYPE_ATTRIBUTE = /\stype\s*=\s*["']?([^"'\s>]+)/i;
const EXECUTABLE_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

/**
 * El contenido de los scripts en línea que el navegador ejecutaría. Los bloques
 * de datos (`application/json`, `application/ld+json`) no se ejecutan y la CSP
 * no los mira.
 */
export function executableInlineScripts(html: string): string[] {
  const scripts: string[] = [];
  for (const [, attributes, body] of html.matchAll(SCRIPT_TAG)) {
    const type = TYPE_ATTRIBUTE.exec(attributes)?.[1].toLowerCase() ?? '';
    if (!SRC_ATTRIBUTE.test(attributes) && EXECUTABLE_TYPES.has(type)) {
      scripts.push(body);
    }
  }
  return scripts;
}

/** Fuente CSP `'sha256-…'` de un script, calculada sobre su texto exacto. */
export async function scriptHashSource(script: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(script));
  return `'sha256-${toBase64(new Uint8Array(digest))}'`;
}

/** Los hashes de todo script fijo: los del template más el cargador de CSS crítico. */
export async function trustedScriptHashes(template: string): Promise<string[]> {
  const scripts = [...executableInlineScripts(template), CRITICAL_CSS_LOADER];
  const hashes = await Promise.all(scripts.map(scriptHashSource));
  return [...new Set(hashes)];
}

/** 128 bits al azar por pedido: imposible de adivinar, y no se repite. */
export function createNonce(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * De dónde se aceptan scripts en línea en este pedido.
 *
 * Sin los hashes del template (el servidor de desarrollo no lo escribe a disco)
 * no hay forma de avalar sus scripts, y bloquearlos rompería la página. Ahí se
 * vuelve a `'unsafe-inline'`, solo: junto a un nonce o un hash, el navegador lo
 * ignoraría.
 */
export function inlineScriptSources(nonce: string, scriptHashes: readonly string[] | null): string[] {
  return scriptHashes ? [`'nonce-${nonce}'`, ...scriptHashes] : ["'unsafe-inline'"];
}

/**
 * La política completa. Los estilos siguen admitiendo `'unsafe-inline'`:
 * Angular y el CSS crítico los inyectan en línea, y un estilo inyectado no
 * ejecuta código.
 */
export function buildContentSecurityPolicy(inlineSources: readonly string[]): string {
  return [
    "default-src 'self'",
    ['script-src', "'self'", ...inlineSources].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}
