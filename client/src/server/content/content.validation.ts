import { Client } from '../../app/domain/models/client.model';
import { FaqEntry } from '../../app/domain/models/faq.model';
import { Metric } from '../../app/domain/models/metric.model';
import { ProcessStep } from '../../app/domain/models/process-step.model';
import { Service } from '../../app/domain/models/service.model';
import { Lang, SUPPORTED_LANGS } from '../../app/domain/models/language.model';
import { ContentSection, SiteContent } from '../../app/domain/models/site-content.model';

/**
 * Validación del contenido que llega del panel. Todo lo que entra por la red es
 * hostil hasta que se demuestre lo contrario: acá se recorta a la forma exacta
 * del dominio y se descarta cualquier campo de más, de modo que nada que el
 * panel no haya pedido termine guardado ni publicado.
 */

export type ContentValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_ITEMS = 60;
const MAX_LIST = 12;

const LIMITS = {
  id: 60,
  short: 160,
  long: 2000,
  url: 400,
} as const;

/**
 * Un color de marca termina escrito en una custom property de CSS: se aceptan
 * literales de color inertes y nada más, nunca una expresión capaz de arrastrar
 * otra declaración detrás.
 */
const COLOR_PATTERN = /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,59}$/;
const BITS_PATTERN = /^[01]{4,16}$/;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return text(value, max);
}

function identifier(value: unknown): string | null {
  const raw = text(value, LIMITS.id);
  return raw && ID_PATTERN.test(raw) ? raw : null;
}

/** Sólo http y https: un `javascript:` en un enlace del sitio es un XSS servido por la casa. */
function link(value: unknown): string | null | undefined {
  const raw = optionalText(value, LIMITS.url);
  if (raw === undefined || raw === null) {
    return raw;
  }
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function integer(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

/** Una entrada por idioma, exigiendo que estén todos los soportados. */
function copy<T>(
  value: unknown,
  parseOne: (raw: Record<string, unknown>) => T | null,
): Record<Lang, T> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const source = value as Record<string, unknown>;
  const result = {} as Record<Lang, T>;

  for (const lang of SUPPORTED_LANGS) {
    const raw = source[lang];
    if (typeof raw !== 'object' || raw === null) {
      return null;
    }
    const parsed = parseOne(raw as Record<string, unknown>);
    if (parsed === null) {
      return null;
    }
    result[lang] = parsed;
  }
  return result;
}

function stringList(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > max) {
    return null;
  }
  const items = value.map((entry) => text(entry, LIMITS.short));
  return items.every((entry): entry is string => entry !== null) ? items : null;
}

function service(raw: Record<string, unknown>): Service | null {
  const id = identifier(raw['id']);
  const bits = text(raw['bits'], 16);
  const parsedCopy = copy(raw['copy'], (entry) => {
    const name = text(entry['name'], LIMITS.short);
    const description = text(entry['description'], LIMITS.long);
    const deliverables = stringList(entry['deliverables'], MAX_LIST);
    return name && description && deliverables ? { name, description, deliverables } : null;
  });

  if (!id || !bits || !BITS_PATTERN.test(bits) || !parsedCopy) {
    return null;
  }
  return { id, bits, copy: parsedCopy };
}

function metric(raw: Record<string, unknown>): Metric | null {
  const id = identifier(raw['id']);
  const value = integer(raw['value'], 0, 1000000);
  const prefix = optionalText(raw['prefix'], 4);
  const suffix = optionalText(raw['suffix'], 8);
  const parsedCopy = copy(raw['copy'], (entry) => {
    const label = text(entry['label'], LIMITS.short);
    const detail = text(entry['detail'], LIMITS.short);
    return label && detail ? { label, detail } : null;
  });

  if (!id || value === null || prefix === null || suffix === null || !parsedCopy) {
    return null;
  }
  return { id, value, prefix, suffix, copy: parsedCopy };
}

function client(raw: Record<string, unknown>): Client | null {
  const id = identifier(raw['id']);
  const name = text(raw['name'], LIMITS.short);
  const since = integer(raw['since'], 1980, 2100);
  const website = link(raw['website']);
  const brandColor = optionalText(raw['brandColor'], 32);
  const parsedCopy = copy(raw['copy'], (entry) => {
    const industry = text(entry['industry'], LIMITS.short);
    const summary = text(entry['summary'], LIMITS.long);
    return industry && summary ? { industry, summary } : null;
  });

  if (!id || !name || since === null || website === null || !parsedCopy) {
    return null;
  }
  if (brandColor === null || (brandColor !== undefined && !COLOR_PATTERN.test(brandColor))) {
    return null;
  }
  return { id, name, since, website, brandColor, copy: parsedCopy };
}

function step(raw: Record<string, unknown>): ProcessStep | null {
  const id = identifier(raw['id']);
  const order = integer(raw['order'], 1, 99);
  const parsedCopy = copy(raw['copy'], (entry) => {
    const name = text(entry['name'], LIMITS.short);
    const description = text(entry['description'], LIMITS.long);
    const duration = text(entry['duration'], LIMITS.short);
    return name && description && duration ? { name, description, duration } : null;
  });

  if (!id || order === null || !parsedCopy) {
    return null;
  }
  return { id, order, copy: parsedCopy };
}

function faq(raw: Record<string, unknown>): FaqEntry | null {
  const id = identifier(raw['id']);
  const parsedCopy = copy(raw['copy'], (entry) => {
    const question = text(entry['question'], LIMITS.short);
    const answer = text(entry['answer'], LIMITS.long);
    return question && answer ? { question, answer } : null;
  });

  return id && parsedCopy ? { id, copy: parsedCopy } : null;
}

const PARSERS = {
  services: service,
  metrics: metric,
  clients: client,
  steps: step,
  faqs: faq,
} as const;

/**
 * Una colección entera, con ids únicos: dos entradas con el mismo id romperían
 * el `track` de las listas y el orden dejaría de ser estable.
 */
export function validateSection<S extends ContentSection>(
  section: S,
  value: unknown,
): ContentValidationResult<SiteContent[S]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'INVALID_COLLECTION' };
  }
  if (value.length > MAX_ITEMS) {
    return { ok: false, error: 'TOO_MANY_ITEMS' };
  }

  const parse = PARSERS[section] as (raw: Record<string, unknown>) => unknown;
  const parsed: unknown[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      return { ok: false, error: 'INVALID_ITEM' };
    }
    const item = parse(entry as Record<string, unknown>);
    if (item === null) {
      return { ok: false, error: 'INVALID_ITEM' };
    }
    const id = (item as { id: string }).id;
    if (seen.has(id)) {
      return { ok: false, error: 'DUPLICATE_ID' };
    }
    seen.add(id);
    parsed.push(item);
  }

  return { ok: true, value: parsed as SiteContent[S] };
}
