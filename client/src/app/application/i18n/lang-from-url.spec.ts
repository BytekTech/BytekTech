import { langFromUrl } from './lang-from-url';

describe('langFromUrl', () => {
  it('lee el idioma del primer segmento', () => {
    expect(langFromUrl('/es')).toBe('es');
    expect(langFromUrl('/en')).toBe('en');
  });

  it('ignora el ancla y los parámetros', () => {
    expect(langFromUrl('/en#contacto')).toBe('en');
    expect(langFromUrl('/en?ref=linkedin')).toBe('en');
    expect(langFromUrl('/en?ref=x#clientes')).toBe('en');
  });

  it('cae al idioma por defecto en la raíz o ante un segmento desconocido', () => {
    expect(langFromUrl('/')).toBe('es');
    expect(langFromUrl('')).toBe('es');
    expect(langFromUrl('/pt')).toBe('es');
  });
});
