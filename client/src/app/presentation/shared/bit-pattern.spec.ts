import { bitPattern } from './bit-pattern';

describe('bitPattern', () => {
  it('expande cada carácter a sus 8 bits ASCII', () => {
    // 'b' = 98 = 01100010
    expect(bitPattern('b')).toEqual([false, true, true, false, false, false, true, false]);
  });

  it('devuelve 8 bits por carácter', () => {
    expect(bitPattern('bytek').length).toBe(5 * 8);
  });

  it('devuelve vacío para texto vacío', () => {
    expect(bitPattern('')).toEqual([]);
  });
});
