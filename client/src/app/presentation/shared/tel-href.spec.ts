import { telHref } from './tel-href';

describe('telHref', () => {
  it('deja el número listo para marcar, sin espacios ni guiones', () => {
    expect(telHref('+54 11 5963-8765')).toBe('tel:+541159638765');
  });

  it('conserva el prefijo internacional', () => {
    expect(telHref('+54 11 5963-8765').startsWith('tel:+')).toBe(true);
  });

  it('descarta cualquier adorno alrededor del número', () => {
    expect(telHref('(011) 5963.8765')).toBe('tel:01159638765');
  });
});
