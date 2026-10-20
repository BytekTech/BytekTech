import { Lang, SUPPORTED_LANGS } from '../../../domain/models/language.model';
import { ContentSection } from '../../../domain/models/site-content.model';
import {
  ICON_FORMATS,
  ICON_MAX_BYTES,
  ICON_MAX_PIXELS,
  ICON_MIN_PIXELS,
  IconIssue,
} from '../../../domain/models/client-icon';
import {
  BITS_PATTERN,
  COLOR_PATTERN,
  METRIC_VALUE_RANGE,
  ORDER_RANGE,
  Range,
  SINCE_RANGE,
  withinRange,
} from '../../../domain/models/content-rules';

/**
 * Descripción de los formularios del panel.
 *
 * Las cinco secciones se editan con la misma pantalla: en vez de cinco
 * formularios escritos a mano —cinco lugares donde olvidarse de un campo al
 * agregarlo al dominio—, cada sección declara qué campos tiene y la vista los
 * dibuja. Agregar un campo es agregar una línea acá.
 */

export type FieldKind = 'text' | 'textarea' | 'number' | 'color' | 'list' | 'image';

/** Lo que el selector de archivos ofrece abrir, en el orden en que conviene. */
export const ICON_ACCEPT = ICON_FORMATS.join(',');

/** El motivo del rechazo de un icono, en palabras. */
export function explainIconIssue(issue: IconIssue): string {
  switch (issue) {
    case 'format':
      return 'Tiene que ser SVG, PNG o WebP';
    case 'weight':
      return `No puede pesar más de ${ICON_MAX_BYTES / 1024} KB`;
    case 'tooSmall':
      return `Tiene que medir al menos ${ICON_MIN_PIXELS}px de lado, o se vería blando`;
    case 'tooLarge':
      return `No puede pasar de ${ICON_MAX_PIXELS}px de lado`;
    case 'unsafe':
      return 'El SVG trae código adentro y no se puede publicar';
    case 'unreadable':
      return 'No se pudo leer la imagen';
  }
}

/**
 * Enlace aceptable a primera vista. El servidor es el que decide de verdad
 * —parsea la URL y exige http o https—; acá alcanza con reconocer lo que
 * claramente no va a pasar, para poder señalarlo antes de intentar publicar.
 */
const URL_PATTERN = /^https?:\/\/\S+$/i;

/** Cualquier esquema ya escrito: `https://`, pero también `mailto:` o `ftp://`. */
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Completa el `https://` que casi nadie escribe. Sólo cuando no hay ningún
 * esquema puesto: si alguien escribió uno a propósito —aunque sea uno que el
 * servidor va a rechazar— no es una omisión, y taparlo escondería el problema.
 */
function withScheme(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || SCHEME_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export interface FieldSpec {
  /** Propiedad del ítem, o del bloque de idioma cuando `perLang` está activo. */
  key: string;
  label: string;
  kind: FieldKind;
  /** Los campos traducibles viven dentro de `copy[idioma]`, uno por idioma. */
  perLang: boolean;
  hint?: string;
  /** Un campo que el servidor acepta vacío. Los demás frenan la publicación. */
  optional?: boolean;
  /** Forma que exige el servidor cuando no alcanza con que esté completo. */
  pattern?: RegExp;
  /** Qué decirle a quien escribió algo que no cumple esa forma. */
  badFormat?: string;
  /** Rango que exige el servidor para los numéricos. */
  range?: Range;
  /**
   * Arregla sola lo que se escribió, al salir del campo. Para lo que es una
   * omisión y no un error: nadie escribe el `https://` de memoria.
   */
  normalize?: (value: string) => string;
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

/**
 * Id de un ítem nuevo. No se edita desde el panel —es la llave interna, no
 * contenido—, así que lo pone el formulario y cumple el patrón que exige el
 * servidor.
 *
 * Lleva azar además del reloj porque ya no hay campo donde resolver un choque:
 * dos ids iguales son un `DUPLICATE_ID` sin salida desde la pantalla.
 */
function draftId(): string {
  const stamp = Date.now().toString(36);
  const salt = Math.random().toString(36).slice(2, 6);
  return `nuevo-${stamp}-${salt}`;
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
      { key: 'bits', label: 'Byte', kind: 'text', perLang: false, hint: 'ocho ceros y unos', pattern: BITS_PATTERN, badFormat: 'Sólo ceros y unos, entre cuatro y dieciséis' },
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
      { key: 'value', label: 'Valor', kind: 'number', perLang: false, range: METRIC_VALUE_RANGE },
      { key: 'prefix', label: 'Prefijo', kind: 'text', perLang: false, hint: 'opcional: + o ~', optional: true },
      { key: 'suffix', label: 'Sufijo', kind: 'text', perLang: false, hint: 'opcional: % o /10', optional: true },
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
      { key: 'name', label: 'Nombre', kind: 'text', perLang: false },
      { key: 'since', label: 'Cliente desde', kind: 'number', perLang: false, range: SINCE_RANGE },
      {
        key: 'website',
        label: 'Sitio web',
        kind: 'text',
        perLang: false,
        hint: 'opcional',
        optional: true,
        pattern: URL_PATTERN,
        badFormat: 'Tiene que empezar con https://',
        normalize: withScheme,
      },
      { key: 'brandColor', label: 'Color de marca', kind: 'color', perLang: false, optional: true, pattern: COLOR_PATTERN },
      {
        key: 'icon',
        label: 'Icono',
        kind: 'image',
        perLang: false,
        hint: `opcional: SVG, PNG o WebP · desde ${ICON_MIN_PIXELS}px · hasta ${ICON_MAX_BYTES / 1024} KB`,
        optional: true,
      },
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
      { key: 'order', label: 'Orden', kind: 'number', perLang: false, range: ORDER_RANGE },
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

/** Un campo numérico vacío no es el cero: es un campo sin completar. */
function asNumber(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return raw;
  }
  const written = typeof raw === 'string' ? raw.trim() : '';
  return written ? Number(written) : null;
}

/**
 * Qué le falta al campo, en palabras, o `null` si está bien.
 *
 * No se valida acá para confiar —el servidor sigue siendo la autoridad y
 * rechaza igual—, sino para poder decir cuál es el campo y qué tiene, que es
 * justo lo que el rechazo no dice: vuelve un único `INVALID_ITEM` para toda la
 * sección. Las reglas de forma salen del dominio, las mismas que aplica la
 * validación del servidor.
 */
export function fieldIssue(item: EditableItem, field: FieldSpec, lang: Lang): string | null {
  const raw = field.perLang ? item.copy?.[lang]?.[field.key] : item[field.key];

  if (field.kind === 'list') {
    // Un renglón en blanco no es un entregable: el servidor pide al menos uno.
    const entries = Array.isArray(raw) ? raw.filter((entry) => String(entry).trim()) : [];
    return entries.length === 0 ? 'Escribí al menos un renglón' : null;
  }

  /*
   * El icono no se revalida acá. Se revisa entero al elegirlo —y el servidor
   * lo revisa de nuevo al publicar—, así que lo guardado ya pasó. Repetirlo
   * significaría decodificar su base64 en cada ciclo de detección de cambios,
   * que para 100 KB por fila se nota.
   */
  if (field.kind === 'image') {
    return null;
  }

  if (field.kind === 'number') {
    const value = asNumber(raw);
    if (value === null || !Number.isInteger(value)) {
      return 'Tiene que ser un número entero';
    }
    if (field.range && !withinRange(value, field.range)) {
      return `Tiene que estar entre ${field.range.min} y ${field.range.max}`;
    }
    return null;
  }

  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    return field.optional ? null : 'Completá este campo';
  }
  if (field.pattern && !field.pattern.test(value)) {
    return field.badFormat ?? 'Revisá el formato';
  }
  return null;
}

/** Si el campo, tal como está, le haría rechazar la publicación al servidor. */
export function blocksPublishing(item: EditableItem, field: FieldSpec, lang: Lang): boolean {
  return fieldIssue(item, field, lang) !== null;
}

/** Si al ítem le falta algo en los campos traducibles de ese idioma. */
export function langBlocksPublishing(item: EditableItem, spec: SectionSpec, lang: Lang): boolean {
  return spec.fields.some((field) => field.perLang && blocksPublishing(item, field, lang));
}

/**
 * Si al ítem le falta algo en cualquier campo y en cualquier idioma. Se mira
 * así —y no sólo el idioma a la vista— porque la fila se publica entera: lo que
 * falte en inglés frena igual mientras se edita el español.
 */
export function itemBlocksPublishing(item: EditableItem, spec: SectionSpec): boolean {
  return SUPPORTED_LANGS.some((lang) =>
    spec.fields.some((field) => blocksPublishing(item, field, lang)),
  );
}
