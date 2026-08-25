import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SiteContent, CONTENT_SECTIONS } from '../../app/domain/models/site-content.model';
import { ContentStore } from './content.store';
import { seedContent } from '../../app/data/content/seed-content';
import { validateSection } from './content.validation';

/**
 * Contenido guardado en un archivo JSON.
 *
 * Es la implementación más simple que persiste de verdad y no agrega
 * infraestructura: alcanza para desarrollo y para un servidor con disco propio.
 * En un entorno serverless el disco es efímero —lo escrito se pierde al
 * reciclarse la instancia—, así que ahí este store hay que reemplazarlo por uno
 * contra una base. Cambiar de motor es escribir otro ContentStore: nada más
 * del servidor sabe de archivos.
 */
export class FileContentStore implements ContentStore {
  private cached: SiteContent | null = null;

  constructor(private readonly filePath = defaultContentPath()) {}

  async read(): Promise<SiteContent> {
    if (this.cached) {
      return structuredClone(this.cached);
    }

    this.cached = await this.readFromDisk();
    return structuredClone(this.cached);
  }

  async write(content: SiteContent): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    // Escritura atómica: si el proceso se cae a mitad de camino, el archivo
    // bueno sigue siendo el viejo y no queda un JSON cortado por la mitad.
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(content, null, 2), 'utf8');
    await rename(temporary, this.filePath);

    this.cached = structuredClone(content);
  }

  private async readFromDisk(): Promise<SiteContent> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch {
      // Todavía nadie guardó nada: el sitio arranca con el contenido de fábrica.
      return seedContent();
    }

    try {
      return parseContent(JSON.parse(raw));
    } catch {
      // Un archivo ilegible no puede dejar el sitio en blanco: se sirve la
      // semilla y se avisa, que es un problema del operador, no del visitante.
      console.error(`Contenido ilegible en ${this.filePath}: se sirve el contenido de fábrica.`);
      return seedContent();
    }
  }
}

/**
 * Lo que vuelve del disco se valida igual que lo que llega por la red: un
 * archivo editado a mano tiene los mismos errores posibles que un formulario.
 */
function parseContent(raw: unknown): SiteContent {
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

/** Ruta del archivo de contenido, configurable para no atarla al layout del deploy. */
export function defaultContentPath(): string {
  return process.env['CONTENT_FILE'] ?? resolve(process.cwd(), '.data', 'content.json');
}
