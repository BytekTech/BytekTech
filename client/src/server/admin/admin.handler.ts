import type { Request } from 'express';
import { clientIp, forwardErrors } from '../http';
import { AttemptLimiter } from '../rate-limit';
import { SessionRevocations } from './session-revocations';
import {
  issueSession,
  readCookie,
  serializeSessionCookie,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  sessionDeadline,
  verifyPassword,
} from './session';

/** Cinco intentos por hora y por IP: la fuerza bruta contra una sola clave se apaga sola. */
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 60 * 60 * 1000;

/** Lo que el panel necesita de afuera: dónde se cuentan los intentos y las sesiones cerradas. */
export interface AdminDependencies {
  loginAttempts: AttemptLimiter;
  revocations: SessionRevocations;
}

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

export function createAdminHandlers({ loginAttempts, revocations }: AdminDependencies) {
  /** El token de la cookie, si lo emitió esta casa, no venció y nadie cerró esa sesión. */
  async function activeSession(req: Request, secret: string): Promise<string | null> {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (!token || sessionDeadline(token, secret) === null || (await revocations.isRevoked(token))) {
      return null;
    }
    return token;
  }

  /** Deja pasar sólo con sesión válida. Todo lo que escribe contenido pasa por acá. */
  const requireAdmin = forwardErrors(async (req, res, next) => {
    const config = adminConfig();
    if (!config) {
      res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
      return;
    }
    if (!hasSameOrigin(req)) {
      res.status(403).json({ error: 'FORBIDDEN_ORIGIN' });
      return;
    }
    if (!(await activeSession(req, config.sessionSecret))) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    next();
  });

  const handleLogin = forwardErrors(async (req, res) => {
    const config = adminConfig();
    if (!config) {
      res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
      return;
    }
    if (!hasSameOrigin(req)) {
      res.status(403).json({ error: 'FORBIDDEN_ORIGIN' });
      return;
    }
    if (!(await loginAttempts.tryConsume(clientIp(req)))) {
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
  });

  /** Borra la cookie y, además, invalida el token: una copia de la cookie tampoco entra. */
  const handleLogout = forwardErrors(async (req, res) => {
    const config = adminConfig();
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    const deadline = config ? sessionDeadline(token, config.sessionSecret) : null;
    if (token && deadline !== null) {
      await revocations.revoke(token, deadline);
    }
    res.setHeader(
      'Set-Cookie',
      serializeSessionCookie('', { secure: isSecureRequest(req), maxAgeMs: 0 }),
    );
    res.status(204).end();
  });

  /** Le dice al panel si la sesión sigue en pie, sin exponer nada más. */
  const handleSession = forwardErrors(async (req, res) => {
    const config = adminConfig();
    if (!config) {
      res.status(503).json({ error: 'ADMIN_NOT_CONFIGURED' });
      return;
    }
    res.json({ authenticated: (await activeSession(req, config.sessionSecret)) !== null });
  });

  return { requireAdmin, handleLogin, handleLogout, handleSession };
}
