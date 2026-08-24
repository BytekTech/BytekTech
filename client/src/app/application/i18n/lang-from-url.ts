import { DEFAULT_LANG, isLang, Lang } from '../../domain/models/language.model';

/**
 * Idioma codificado en el primer segmento de la URL: '/en#contacto' → 'en'.
 * Cae al idioma por defecto cuando el segmento no corresponde a un idioma
 * soportado (por ejemplo durante la navegación inicial a '/').
 */
export function langFromUrl(url: string): Lang {
  const [path] = url.split(/[?#]/);
  const [segment] = path.split('/').filter(Boolean);
  return isLang(segment) ? segment : DEFAULT_LANG;
}
