import { DEFAULT_THEME, isTheme, Theme } from '../../domain/models/theme.model';

/**
 * Tema inicial del visitante. La elección explícita que haya guardado pesa más
 * que la preferencia del sistema; sin ninguna de las dos, se sirve el claro.
 */
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (isTheme(stored)) {
    return stored;
  }
  return prefersDark ? 'dark' : DEFAULT_THEME;
}
