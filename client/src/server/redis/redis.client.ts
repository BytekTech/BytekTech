export interface RedisConfig {
  /** URL REST de la base, la que da Upstash (o la integración de Vercel). */
  url: string;
  token: string;
}

export type Env = Record<string, string | undefined>;

/**
 * Credenciales de Redis, si están. Se aceptan los dos nombres en uso: los que
 * inyecta la integración de Upstash en Vercel (`KV_*`) y los de la consola de
 * Upstash (`UPSTASH_REDIS_*`). Sólo HTTPS: el token viaja en cada pedido.
 */
export function redisConfig(env: Env): RedisConfig | null {
  const url = env['KV_REST_API_URL'] ?? env['UPSTASH_REDIS_REST_URL'];
  const token = env['KV_REST_API_TOKEN'] ?? env['UPSTASH_REDIS_REST_TOKEN'];
  if (!url || !token || !url.startsWith('https://')) {
    return null;
  }
  return { url, token };
}

/**
 * Cada render del sitio lee de acá: si Redis se cuelga, mejor fallar rápido que
 * dejar todos los pedidos esperando hasta que la plataforma los corte.
 */
const REDIS_TIMEOUT_MS = 5000;

/**
 * Cliente mínimo de la API REST de Upstash, con `fetch` y no con su paquete:
 * son un puñado de comandos, y así no entra al servidor una dependencia más que
 * auditar. Lo comparten todos los que guardan algo en Redis.
 */
export class RedisClient {
  constructor(
    private readonly config: RedisConfig,
    private readonly send: typeof fetch = fetch,
  ) {}

  /** Un comando de Redis. Si Redis no responde o lo rechaza, falla. */
  async command<T>(args: string[]): Promise<T> {
    const response = await this.send(this.config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => ({}))) as { result?: T; error?: string };
    if (!response.ok || body.error !== undefined) {
      throw new Error(`REDIS_${args[0]}_FAILED: ${body.error ?? response.status}`);
    }
    return body.result as T;
  }
}
