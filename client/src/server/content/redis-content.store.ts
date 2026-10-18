import { SiteContent } from '../../app/domain/models/site-content.model';
import { seedContent } from '../../app/data/content/seed-content';
import { ContentStore } from './content.store';
import { parseContent } from './content.parsing';

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

/** Una sola clave: el contenido se lee y se escribe entero, como en el archivo. */
export const CONTENT_KEY = 'bytek:content';

/**
 * Contenido guardado en Redis (Upstash), para entornos sin disco propio.
 *
 * Habla con la API REST de Upstash con `fetch` y no con su cliente: son dos
 * comandos, y así no entra al servidor una dependencia más que auditar.
 *
 * No guarda caché en memoria a propósito: en serverless conviven varias
 * instancias, y la que no recibió el guardado seguiría mostrando lo anterior.
 */
export class RedisContentStore implements ContentStore {
  constructor(
    private readonly config: RedisConfig,
    private readonly send: typeof fetch = fetch,
  ) {}

  async read(): Promise<SiteContent> {
    const stored = await this.command<string | null>(['GET', CONTENT_KEY]);
    if (stored === null) {
      // Todavía nadie publicó nada: el sitio arranca con el contenido de fábrica.
      return seedContent();
    }

    try {
      return parseContent(JSON.parse(stored));
    } catch {
      console.error(`Contenido ilegible en ${CONTENT_KEY}: se sirve el contenido de fábrica.`);
      return seedContent();
    }
  }

  async write(content: SiteContent): Promise<void> {
    await this.command(['SET', CONTENT_KEY, JSON.stringify(content)]);
  }

  /**
   * Un comando de Redis por la API REST. Si Redis no responde, falla: servir
   * el contenido de fábrica en ese caso haría que el panel lo cargara y que el
   * próximo guardado pisara lo publicado.
   */
  private async command<T>(args: string[]): Promise<T> {
    const response = await this.send(this.config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    const body = (await response.json().catch(() => ({}))) as { result?: T; error?: string };
    if (!response.ok || body.error !== undefined) {
      throw new Error(`REDIS_${args[0]}_FAILED: ${body.error ?? response.status}`);
    }
    return body.result as T;
  }
}
