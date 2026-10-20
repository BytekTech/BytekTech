/**
 * Reglas del icono de un cliente.
 *
 * El icono viaja embebido como data URI dentro del contenido publicado, y ese
 * contenido viaja dentro del HTML en cada carga del sitio. No hay almacenamiento
 * de archivos detrás: por eso el límite de peso no es una preferencia estética
 * sino lo que sostiene el tiempo de carga, y por eso se prefiere SVG, que pesa
 * una fracción y no tiene resolución que perder.
 *
 * Viven en el dominio porque las aplican los dos lados: el panel para avisar
 * antes de subir, el servidor para aceptar o rechazar. El servidor es la
 * autoridad; lo que valida el panel es cortesía.
 */

/** Formatos aceptados. Vector primero: es el que no se pixela nunca. */
export const ICON_FORMATS = ['image/svg+xml', 'image/png', 'image/webp'] as const;

export type IconFormat = (typeof ICON_FORMATS)[number];

/** Tope de peso del archivo original, antes de la inflación del base64 (~33%). */
export const ICON_MAX_BYTES = 100 * 1024;

/**
 * Tope de largo del texto del data URI, que se mira antes de decodificar nada:
 * así un envío absurdo se corta sin gastar memoria en expandirlo. El base64
 * infla un tercio y el prefijo son unas decenas de caracteres.
 */
export const ICON_MAX_DATA_URI_LENGTH = Math.ceil((ICON_MAX_BYTES * 4) / 3) + 64;

/**
 * Lado mínimo de un icono de mapa de bits. La marca se dibuja a unos 112px, y
 * en una pantalla de densidad triple eso son 336px reales: con menos de esto se
 * ve blando justo donde tiene que verse nítido.
 */
export const ICON_MIN_PIXELS = 256;

/** Más que esto no agrega nitidez visible y sí peso al HTML de cada visita. */
export const ICON_MAX_PIXELS = 1024;

/** Por qué no sirve el icono. La traducción a palabras es de quien lo muestra. */
export type IconIssue =
  | 'format'
  | 'weight'
  | 'tooSmall'
  | 'tooLarge'
  | 'unreadable'
  | 'unsafe';

export interface IconBytes {
  format: IconFormat;
  bytes: Uint8Array;
}

/** Tamaño en píxeles de una imagen de mapa de bits. */
export interface PixelSize {
  width: number;
  height: number;
}

const DATA_URI = /^data:([a-z0-9/+.\-]+);base64,([A-Za-z0-9+/]+={0,2})$/;

function isIconFormat(value: string): value is IconFormat {
  return (ICON_FORMATS as readonly string[]).includes(value);
}

/**
 * Separa un data URI en formato y bytes. Devuelve `null` ante cualquier cosa
 * que no sea exactamente eso: un `data:` mal formado no se intenta arreglar.
 */
export function parseIconDataUri(value: string): IconBytes | null {
  const match = DATA_URI.exec(value.trim());
  if (!match) {
    return null;
  }

  const [, mime, payload] = match;
  if (!isIconFormat(mime)) {
    return null;
  }

  try {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return { format: mime, bytes };
  } catch {
    return null;
  }
}

/** Entero de 32 bits, big-endian: como los escribe PNG. */
function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

function hasAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let index = 0; index < text.length; index++) {
    if (bytes[offset + index] !== text.charCodeAt(index)) {
      return false;
    }
  }
  return true;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Lado de un PNG, leído de su cabecera. El IHDR es obligatorio y va primero:
 * ancho y alto están en posiciones fijas, sin necesidad de decodificar nada.
 */
function readPngSize(bytes: Uint8Array): PixelSize | null {
  if (bytes.length < 24 || !PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    return null;
  }
  if (!hasAscii(bytes, 12, 'IHDR')) {
    return null;
  }
  return { width: readUint32BE(bytes, 16), height: readUint32BE(bytes, 20) };
}

/**
 * Lado de un WebP. Hay tres variantes y cada una guarda la medida en otro lado:
 * la extendida la trae explícita, la con pérdida la esconde tras el marcador de
 * cuadro, y la sin pérdida la tiene empaquetada en bits.
 */
function readWebpSize(bytes: Uint8Array): PixelSize | null {
  if (bytes.length < 30 || !hasAscii(bytes, 0, 'RIFF') || !hasAscii(bytes, 8, 'WEBP')) {
    return null;
  }

  if (hasAscii(bytes, 12, 'VP8X')) {
    return { width: readUint24LE(bytes, 24) + 1, height: readUint24LE(bytes, 27) + 1 };
  }

  if (hasAscii(bytes, 12, 'VP8L')) {
    // 14 bits para cada lado, corridos: ancho en los 14 primeros, alto en los
    // 14 siguientes, ambos guardados como "uno menos".
    const packed =
      bytes[21] + (bytes[22] << 8) + (bytes[23] << 16) + ((bytes[24] << 24) >>> 0);
    return {
      width: (packed & 0x3fff) + 1,
      height: ((packed >> 14) & 0x3fff) + 1,
    };
  }

  if (hasAscii(bytes, 12, 'VP8 ')) {
    // El cuadro arranca con su marcador de tres bytes; las medidas vienen
    // después, en catorce bits cada una.
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return null;
    }
    return {
      width: (bytes[26] + (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] + (bytes[29] << 8)) & 0x3fff,
    };
  }

  return null;
}

/** Medida de una imagen de mapa de bits, o `null` si la cabecera no se entiende. */
export function readPixelSize(icon: IconBytes): PixelSize | null {
  if (icon.format === 'image/png') {
    return readPngSize(icon.bytes);
  }
  if (icon.format === 'image/webp') {
    return readWebpSize(icon.bytes);
  }
  return null;
}

/**
 * Construcciones de un SVG que no tienen lugar en un logotipo y sí en un
 * ataque: scripts, manejadores de evento, contenido HTML incrustado y
 * referencias a otro servidor.
 *
 * El sitio dibuja el icono con `<img>`, y ahí el navegador ya no ejecuta nada
 * de esto. Esta defensa es la segunda: que nadie pueda convertir un día el
 * `<img>` en un `innerHTML` y abrir un agujero sin enterarse.
 */
const SVG_DANGERS = [
  /<\s*script/i,
  /<\s*foreignObject/i,
  /\son\w+\s*=/i,
  /javascript:/i,
  /<\s*use[^>]+href\s*=\s*["']?\s*https?:/i,
  /url\(\s*["']?\s*https?:/i,
  /<!ENTITY/i,
];

export function svgLooksUnsafe(bytes: Uint8Array): boolean {
  const source = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  return SVG_DANGERS.some((danger) => danger.test(source));
}

/**
 * Qué le pasa al icono, o `null` si sirve. Un valor vacío no es un problema:
 * el icono es opcional y sin él la marca se dibuja con el patrón generado.
 */
export function iconIssue(value: string): IconIssue | null {
  if (!value.trim()) {
    return null;
  }

  const icon = parseIconDataUri(value);
  if (!icon) {
    return 'format';
  }
  if (icon.bytes.length === 0) {
    return 'unreadable';
  }
  if (icon.bytes.length > ICON_MAX_BYTES) {
    return 'weight';
  }

  if (icon.format === 'image/svg+xml') {
    return svgLooksUnsafe(icon.bytes) ? 'unsafe' : null;
  }

  const size = readPixelSize(icon);
  if (!size || size.width === 0 || size.height === 0) {
    return 'unreadable';
  }
  if (Math.min(size.width, size.height) < ICON_MIN_PIXELS) {
    return 'tooSmall';
  }
  if (Math.max(size.width, size.height) > ICON_MAX_PIXELS) {
    return 'tooLarge';
  }
  return null;
}
