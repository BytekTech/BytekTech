import type { NextFunction, Request, Response } from 'express';
import { SlidingWindowRateLimiter } from '../rate-limit';
import {
  isSessionValid,
  issueSession,
  readCookie,
  serializeSessionCookie,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  verifyPassword,
} from './session';

/** Cinco intentos por hora y por IP: la fuerza bruta contra una sola clave se apaga sola. */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000;
const loginLimiter = new SlidingWindowRateLimiter(MAX_ATTEMPTS, WINDOW_MS);

interface AdminConfig {
  passwordHash: string;
  sessionSecret: string;
}

/**
 * El panel existe sólo si están sus dos secretos. Sin ellos no hay "modo
 * abierto" ni clave por defecto: simplemente no se puede entrar.
 */
function adminConfig(): AdminConfig | null {
  const passwordHash = process.env['ADMIN_PASSWORD_HASH'];
  const sessionSecret = process.env['ADMIN_SESSION_SECRET'];
  return passwordHash && sessionSecret ? { passwordHash, sessionSecret } : null;
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

function isSecureRequest(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

/**
 * Un pedido que cambia datos tiene que haber nacido en esta misma página. La
 * cookie ya es `SameSite=Strict`; comprobar el origen es el segundo cerrojo,
 * por si algún navegador viejo no honra el primero.
 */
export function hasSameOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  if (!origin) {
    // Sin Origin no hay pedido de navegador entre sitios: lo manda un cliente
    // propio (curl, un script del operador), que no arrastra cookies ajenas.
    return true;
  }
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/** Deja pasar sólo con sesión válida. Todo lo que escribe contenido pasa por acá. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const config = adminConfig();
  if (!config) {
    res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
    return;
  }
  if (!hasSameOrigin(req)) {
    res.status(403).json({ error: 'FORBIDDEN_ORIGIN' });
    return;
  }
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  if (!isSessionValid(token, config.sessionSecret)) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  next();
}

export function handleLogin(req: Request, res: Response): void {
  const config = adminConfig();
  if (!config) {
    res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
    return;
  }
  if (!hasSameOrigin(req)) {
    res.status(403).json({ error: 'FORBIDDEN_ORIGIN' });
    return;
  }
  if (!loginLimiter.tryConsume(clientIp(req))) {
    res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
    return;
  }

  const password = (req.body as { password?: unknown } | undefined)?.password;
  if (typeof password !== 'string' || !verifyPassword(password, config.passwordHash)) {
    // Un solo mensaje para todos los fallos: decir "clave incorrecta" ya
    // confirmaría que el panel existe y que la cuenta es esa.
    res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    return;
  }

  res.setHeader(
    'Set-Cookie',
    serializeSessionCookie(issueSession(config.sessionSecret), {
      secure: isSecureRequest(req),
      maxAgeMs: SESSION_TTL_MS,
    }),
  );
  res.status(204).end();
}

export function handleLogout(req: Request, res: Response): void {
  res.setHeader(
    'Set-Cookie',
    serializeSessionCookie('', { secure: isSecureRequest(req), maxAgeMs: 0 }),
  );
  res.status(204).end();
}

/** Le dice al panel si la sesión sigue en pie, sin exponer nada más. */
export function handleSession(req: Request, res: Response): void {
  const config = adminConfig();
  if (!config) {
    res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
    return;
  }
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  res.json({ authenticated: isSessionValid(token, config.sessionSecret) });
}
