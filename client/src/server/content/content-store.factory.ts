import { ContentStore } from './content.store';
import { FileContentStore } from './file-content.store';
import { Env, redisConfig, RedisContentStore } from './redis-content.store';

/**
 * Redis si está configurado; si no, el archivo local. En Vercel el disco es de
 * sólo lectura: sin Redis el sitio se ve, pero el panel no puede publicar, y
 * eso se avisa al arrancar en vez de descubrirse al primer guardado.
 */
export function createContentStore(env: Env = process.env): ContentStore {
  const redis = redisConfig(env);
  if (redis) {
    return new RedisContentStore(redis);
  }
  if (env['VERCEL']) {
    console.error('Falta configurar Redis (KV_REST_API_URL / KV_REST_API_TOKEN): el panel no va a poder publicar.');
  }
  return new FileContentStore();
}
