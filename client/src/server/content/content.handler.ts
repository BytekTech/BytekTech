import type { Request, Response } from 'express';
import { isContentSection } from '../../app/domain/models/site-content.model';
import { ContentStore } from './content.store';
import { validateSection } from './content.validation';

/**
 * Endpoints del contenido. Leer es público —es lo que el sitio muestra—;
 * escribir pasa antes por `requireAdmin`, que es quien decide si hay sesión.
 */

/** GET /api/content: todo el contenido publicado, tal como lo pinta el sitio. */
export function getContent(store: ContentStore) {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await store.read());
    } catch {
      res.status(500).json({ error: 'CONTENT_UNAVAILABLE' });
    }
  };
}

/**
 * PUT /api/content/:section: reemplaza una colección entera.
 *
 * Se guarda de a una sección porque es la unidad que el panel edita: mandar
 * todo el contenido en cada guardado pisaría lo que otra pestaña acabara de
 * cambiar en una sección que ni se estaba tocando.
 */
export function putSection(store: ContentStore) {
  return async (req: Request, res: Response): Promise<void> => {
    const section = req.params['section'];
    if (!isContentSection(section)) {
      res.status(404).json({ error: 'UNKNOWN_SECTION' });
      return;
    }

    const validated = validateSection(section, (req.body as { items?: unknown })?.items);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    try {
      const content = await store.read();
      await store.write({ ...content, [section]: validated.value });
      res.json({ items: validated.value });
    } catch {
      res.status(500).json({ error: 'CONTENT_NOT_SAVED' });
    }
  };
}
