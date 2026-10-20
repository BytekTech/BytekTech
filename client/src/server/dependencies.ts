import { AdminDependencies, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS } from './admin/admin.handler';
import { InMemorySessionRevocations } from './admin/session-revocations';
import { CONTACT_MAX_SUBMISSIONS, CONTACT_WINDOW_MS } from './contact.handler';
import { ContentStore } from './content/content.store';
import { FileContentStore } from './content/file-content.store';
import { RedisContentStore } from './content/redis-content.store';
import { AttemptLimiter, SlidingWindowRateLimiter } from './rate-limit';
import { RedisAttemptLimiter } from './redis/redis-attempt-limiter';
import { Env, RedisClient, redisConfig } from './redis/redis.client';
import { RedisSessionRevocations } from './redis/redis-session-revocations';

export interface ServerDependencies {
  contentStore: ContentStore;
  admin: AdminDependencies;
  contactSubmissions: AttemptLimiter;
}

/**
 * Raíz de composición del servidor: el único lugar que decide qué motor hay
 * detrás de cada puerto.
 *
 * Con Redis configurado, todo lo que tiene que valer igual en cada instancia
 * —el contenido, los intentos de login, las sesiones cerradas, los envíos del
 * formulario de contacto— vive ahí. Sin
 * Redis, cada cosa queda en el proceso o en el disco local, que alcanza para
 * desarrollo. En Vercel el disco es de sólo lectura: sin Redis el sitio se ve,
 * pero el panel no puede publicar, y eso se avisa al arrancar en vez de
 * descubrirse al primer guardado.
 */
export function createServerDependencies(env: Env = process.env): ServerDependencies {
  const config = redisConfig(env);
  if (config) {
    const redis = new RedisClient(config);
    return {
      contentStore: new RedisContentStore(redis),
      admin: {
        loginAttempts: new RedisAttemptLimiter(redis, 'login-attempts', LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS),
        revocations: new RedisSessionRevocations(redis),
      },
      contactSubmissions: new RedisAttemptLimiter(
        redis,
        'contact-submissions',
        CONTACT_MAX_SUBMISSIONS,
        CONTACT_WINDOW_MS,
      ),
    };
  }

  if (env['VERCEL']) {
    console.error('Falta configurar Redis (KV_REST_API_URL / KV_REST_API_TOKEN): el panel no va a poder publicar.');
  }
  return {
    contentStore: new FileContentStore(),
    admin: {
      loginAttempts: new SlidingWindowRateLimiter(LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS),
      revocations: new InMemorySessionRevocations(),
    },
    contactSubmissions: new SlidingWindowRateLimiter(CONTACT_MAX_SUBMISSIONS, CONTACT_WINDOW_MS),
  };
}
