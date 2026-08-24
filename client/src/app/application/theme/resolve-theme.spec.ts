import { resolveTheme } from './resolve-theme';

describe('resolveTheme', () => {
  it('respeta la elección guardada por encima del sistema', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('sigue al sistema cuando no hay elección guardada', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('descarta un valor guardado inválido y vuelve al sistema', () => {
    expect(resolveTheme('azul', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });
});
