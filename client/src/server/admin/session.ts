import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Sesión del panel, firmada y sin estado.
 *
 * No hay tabla de sesiones ni store compartido a propósito: el servidor puede
 * correr en varias instancias a la vez, y una firma con vencimiento se verifica
 * igual en cualquiera de ellas. La cookie no guarda datos, sólo hasta cuándo
 * vale y la prueba de que la emitió esta casa.
 */

/** Ocho horas: una jornada de trabajo, no una sesión eterna en una máquina prestada. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const SESSION_COOKIE = 'bytek_admin';

const SCRYPT_KEY_LENGTH = 64;

/** Comparación en tiempo constante: comparar con === filtra el secreto por el reloj. */
function equals(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Hash de contraseña en el formato guardado en ADMIN_PASSWORD_HASH. */
export function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifica la contraseña contra el hash guardado. Nunca se guarda ni se compara
 * la contraseña en claro: si el archivo de entorno se filtra, lo que se filtra
 * no alcanza para entrar.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, expected] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) {
    return false;
  }
  try {
    const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
    return equals(derived, expected);
  } catch {
    return false;
  }
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Token de sesión: hasta cuándo vale, más la firma de esa fecha. */
export function issueSession(secret: string, now = Date.now()): string {
  const expiresAt = String(now + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function isSessionValid(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) {
    return false;
  }
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || !equals(signature, sign(expiresAt, secret))) {
    return false;
  }
  const deadline = Number(expiresAt);
  return Number.isFinite(deadline) && deadline > now;
}

/** Lee una cookie del encabezado crudo, sin sumar una dependencia para esto. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

export interface CookieOptions {
  secure: boolean;
  maxAgeMs: number;
}

/**
 * `HttpOnly` la esconde de cualquier script de la página, `SameSite=Strict`
 * hace que no viaje en pedidos que nazcan en otro sitio, y `Secure` la ata a
 * HTTPS fuera de desarrollo.
 */
export function serializeSessionCookie(value: string, { secure, maxAgeMs }: CookieOptions): string {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (secure) {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}
