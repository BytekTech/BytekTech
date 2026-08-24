import { isTheme, oppositeTheme } from './theme.model';

describe('isTheme', () => {
  it('reconoce los dos temas', () => {
    expect(isTheme('light')).toBeTrue();
    expect(isTheme('dark')).toBeTrue();
  });

  it('rechaza cualquier otro valor', () => {
    expect(isTheme('auto')).toBeFalse();
    expect(isTheme(null)).toBeFalse();
  });
});

describe('oppositeTheme', () => {
  it('alterna entre los dos temas', () => {
    expect(oppositeTheme('light')).toBe('dark');
    expect(oppositeTheme('dark')).toBe('light');
  });
});
