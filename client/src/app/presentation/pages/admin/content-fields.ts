import { Lang, SUPPORTED_LANGS } from '../../../domain/models/language.model';
import { ContentSection } from '../../../domain/models/site-content.model';

/**
 * Descripción de los formularios del panel.
 *
 * Las cinco secciones se editan con la misma pantalla: en vez de cinco
 * formularios escritos a mano —cinco lugares donde olvidarse de un campo al
 * agregarlo al dominio—, cada sección declara qué campos tiene y la vista los
 * dibuja. Agregar un campo es agregar una línea acá.
 */

export type FieldKind = 'text' | 'textarea' | 'number' | 'color' | 'list';

export interface FieldSpec {
  /** Propiedad del ítem, o del bloque de idioma cuando `perLang` está activo. */
  key: string;
  label: string;
  kind: FieldKind;
  /** Los campos traducibles viven dentro de `copy[idioma]`, uno por idioma. */
  perLang: boolean;
  hint?: string;
}

export interface SectionSpec {
  section: ContentSection;
  label: string;
  /** Cómo se titula cada fila en la lista, para reconocerla sin abrirla. */
  title: (item: EditableItem, lang: Lang) => string;
  fields: FieldSpec[];
  blank: () => EditableItem;
}

/** Un ítem en edición: la forma del dominio, todavía sin validar. */
export interface EditableItem {
  id: string;
  copy: Record<Lang, Record<string, unknown>>;
  [key: string]: unknown;
}

/** Id provisorio de un ítem nuevo: cumple el patrón que exige el servidor. */
function draftId(): string {
  return `nuevo-${Date.now().toString(36)}`;
}

function emptyCopy(keys: readonly string[], lists: readonly string[] = []): Record<Lang, Record<string, unknown>> {
  const copy = {} as Record<Lang, Record<string, unknown>>;
  for (const lang of SUPPORTED_LANGS) {
    copy[lang] = Object.fromEntries(keys.map((key) => [key, lists.includes(key) ? [''] : '']));
  }
  return copy;
}

function localized(item: EditableItem, lang: Lang, key: string): string {
  const value = item.copy?.[lang]?.[key];
  return typeof value === 'string' ? value : '';
}

export const SECTION_SPECS: readonly SectionSpec[] = [
  {
    section: 'services',
    label: 'Servicios',
    title: (item, lang) => localized(item, lang, 'name'),
    fields: [
      { key: 'id', label: 'Identificador', kind: 'text', perLang: false, hint: 'minúsculas y guiones' },
      { key: 'bits', label: 'Byte', kind: 'text', perLang: false, hint: 'ocho ceros y unos' },
      { key: 'name', label: 'Nombre', kind: 'text', perLang: true },
      { key: 'description', label: 'Descripción', kind: 'textarea', perLang: true },
      { key: 'deliverables', label: 'Entregables', kind: 'list', perLang: true },
    ],
    blank: () => ({
      id: draftId(),
      bits: '01000000',
      copy: emptyCopy(['name', 'description', 'deliverables'], ['deliverables']),
    }),
  },
  {
    section: 'metrics',
    label: 'Métricas',
    title: (item, lang) => localized(item, lang, 'label'),
    fields: [
      { key: 'id', label: 'Identificador', kind: 'text', perLang: false },
      { key: 'value', label: 'Valor', kind: 'number', perLang: false },
      { key: 'prefix', label: 'Prefijo', kind: 'text', perLang: false, hint: 'opcional: + o ~' },
      { key: 'suffix', label: 'Sufijo', kind: 'text', perLang: false, hint: 'opcional: % o /10' },
      { key: 'label', label: 'Etiqueta', kind: 'text', perLang: true },
      { key: 'detail', label: 'Detalle', kind: 'text', perLang: true },
    ],
    blank: () => ({ id: draftId(), value: 0, prefix: '', suffix: '', copy: emptyCopy(['label', 'detail']) }),
  },
  {
    section: 'clients',
    label: 'Clientes',
    title: (item) => (typeof item['name'] === 'string' ? item['name'] : ''),
    fields: [
      { key: 'id', label: 'Identificador', kind: 'text', perLang: false },
      { key: 'name', label: 'Nombre', kind: 'text', perLang: false },
      { key: 'since', label: 'Cliente desde', kind: 'number', perLang: false },
      { key: 'website', label: 'Sitio web', kind: 'text', perLang: false, hint: 'opcional, con https://' },
      { key: 'brandColor', label: 'Color de marca', kind: 'color', perLang: false },
      { key: 'industry', label: 'Rubro', kind: 'text', perLang: true },
      { key: 'summary', label: 'Qué se construyó', kind: 'textarea', perLang: true },
    ],
    blank: () => ({
      id: draftId(),
      name: '',
      since: new Date().getFullYear(),
      website: '',
      brandColor: '#000000',
      copy: emptyCopy(['industry', 'summary']),
    }),
  },
  {
    section: 'steps',
    label: 'Proceso',
    title: (item, lang) => localized(item, lang, 'name'),
    fields: [
      { key: 'id', label: 'Identificador', kind: 'text', perLang: false },
      { key: 'order', label: 'Orden', kind: 'number', perLang: false },
      { key: 'name', label: 'Nombre', kind: 'text', perLang: true },
      { key: 'description', label: 'Descripción', kind: 'textarea', perLang: true },
      { key: 'duration', label: 'Duración', kind: 'text', perLang: true },
    ],
    blank: () => ({ id: draftId(), order: 1, copy: emptyCopy(['name', 'description', 'duration']) }),
  },
  {
    section: 'faqs',
    label: 'Preguntas',
    title: (item, lang) => localized(item, lang, 'question'),
    fields: [
      { key: 'id', label: 'Identificador', kind: 'text', perLang: false },
      { key: 'question', label: 'Pregunta', kind: 'text', perLang: true },
      { key: 'answer', label: 'Respuesta', kind: 'textarea', perLang: true },
    ],
    blank: () => ({ id: draftId(), copy: emptyCopy(['question', 'answer']) }),
  },
];

export function specFor(section: ContentSection): SectionSpec {
  const spec = SECTION_SPECS.find((candidate) => candidate.section === section);
  if (!spec) {
    throw new Error(`Sección sin formulario declarado: ${section}`);
  }
  return spec;
}
