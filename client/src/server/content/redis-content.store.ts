import { SiteContent } from '../../app/domain/models/site-content.model';
import { seedContent } from '../../app/data/content/seed-content';
import { RedisClient } from '../redis/redis.client';
import { ContentStore } from './content.store';
import { parseContent } from './content.parsing';

/** Una sola clave: el contenido se lee y se escribe entero, como en el archivo. */
export const CONTENT_KEY = 'bytek:content';

/**
 * Contenido guardado en Redis (Upstash), para entornos sin disco propio.
 *
 * No guarda caché en memoria a propósito: en serverless conviven varias
 * instancias, y la que no recibió el guardado seguiría mostrando lo anterior.
 *
 * Si Redis no responde, falla: servir el contenido de fábrica en ese caso haría
 * que el panel lo cargara y que el próximo guardado pisara lo publicado.
 */
export class RedisContentStore implements ContentStore {
  constructor(private readonly redis: RedisClient) {}

  async read(): Promise<SiteContent> {
    const stored = await this.redis.command<string | null>(['GET', CONTENT_KEY]);
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
    await this.redis.command(['SET', CONTENT_KEY, JSON.stringify(content)]);
  }
}
