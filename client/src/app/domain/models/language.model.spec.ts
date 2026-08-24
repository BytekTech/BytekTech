import {
  DEFAULT_LANG,
  firstSupportedLang,
  isLang,
  langFromAcceptLanguage,
} from './language.model';

describe('isLang', () => {
  it('reconoce los idiomas soportados', () => {
    expect(isLang('es')).toBeTrue();
    expect(isLang('en')).toBeTrue();
  });

  it('rechaza cualquier otro valor', () => {
    expect(isLang('pt')).toBeFalse();
    expect(isLang('ES')).toBeFalse();
    expect(isLang(null)).toBeFalse();
  });
});

describe('firstSupportedLang', () => {
  it('devuelve el primer idioma soportado de la lista', () => {
    expect(firstSupportedLang(['pt-BR', 'en-US', 'es-AR'])).toBe('en');
  });

  it('usa la subetiqueta primaria de una etiqueta regional', () => {
    expect(firstSupportedLang(['es-419'])).toBe('es');
  });

  it('devuelve null cuando no hay ninguno soportado', () => {
    expect(firstSupportedLang(['pt', 'fr'])).toBeNull();
    expect(firstSupportedLang([])).toBeNull();
  });
});

describe('langFromAcceptLanguage', () => {
  it('respeta el factor de calidad por encima del orden de aparición', () => {
    expect(langFromAcceptLanguage('en;q=0.4,es;q=0.9')).toBe('es');
  });

  it('trata la ausencia de q como máxima prioridad', () => {
    expect(langFromAcceptLanguage('en,es;q=0.9')).toBe('en');
  });

  it('ignora los idiomas explícitamente rechazados con q=0', () => {
    expect(langFromAcceptLanguage('es;q=0,en;q=0.1')).toBe('en');
  });

  it('devuelve null con una cabecera vacía o sin idiomas soportados', () => {
    expect(langFromAcceptLanguage('')).toBeNull();
    expect(langFromAcceptLanguage('pt-BR,fr;q=0.8')).toBeNull();
  });

  it('deja al llamador decidir el respaldo', () => {
    expect(langFromAcceptLanguage('ja') ?? DEFAULT_LANG).toBe('es');
  });
});
