export type Lang = 'es' | 'en';

export const SUPPORTED_LANGS: readonly Lang[] = ['es', 'en'];

export const DEFAULT_LANG: Lang = 'es';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && SUPPORTED_LANGS.includes(value as Lang);
}

/**
 * Primer idioma soportado dentro de una lista ya ordenada por preferencia.
 * Acepta etiquetas BCP 47 completas ('en-US'), quedándose con la subetiqueta primaria.
 */
export function firstSupportedLang(candidates: readonly string[]): Lang | null {
  for (const candidate of candidates) {
    const primary = candidate.trim().split('-')[0].toLowerCase();
    if (isLang(primary)) {
      return primary;
    }
  }
  return null;
}

/**
 * Idioma preferido según una cabecera Accept-Language ('es-AR,es;q=0.9,en;q=0.8'),
 * respetando el factor de calidad. Sin factor explícito, q vale 1.
 */
export function langFromAcceptLanguage(header: string): Lang | null {
  const ranked = header
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(';');
      const quality = params.find((param) => param.trim().startsWith('q='));
      return { tag, q: quality ? Number.parseFloat(quality.split('=')[1]) || 0 : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);

  return firstSupportedLang(ranked);
}
