import { CONTENT_SECTIONS, SiteContent } from '../../app/domain/models/site-content.model';
import { seedContent } from '../../app/data/content/seed-content';
import { validateSection } from './content.validation';

/**
 * Lo que vuelve del almacén se valida igual que lo que llega por la red: un
 * archivo editado a mano o una clave pisada desde la consola del proveedor
 * tienen los mismos errores posibles que un formulario.
 *
 * Una sección ausente se completa con la de fábrica; una inválida hace fallar
 * todo, para que quien llama decida qué servir en su lugar.
 */
export function parseContent(raw: unknown): SiteContent {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('INVALID_CONTENT');
  }
  const source = raw as Record<string, unknown>;
  const fallback = seedContent();
  const content = {} as SiteContent;

  for (const section of CONTENT_SECTIONS) {
    if (source[section] === undefined) {
      content[section] = fallback[section] as never;
      continue;
    }
    const validated = validateSection(section, source[section]);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    content[section] = validated.value as never;
  }

  return content;
}
