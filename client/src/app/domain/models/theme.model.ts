export type Theme = 'light' | 'dark';

export const DEFAULT_THEME: Theme = 'light';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
