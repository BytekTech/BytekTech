import {
  BITS_PER_BYTE,
  decodeFrame,
  HeroByte,
  settledBits,
  settledColumn,
  STAGGER_FRAMES,
  totalDecodeFrames,
} from './byte-decode';

// random() fijo en 0 ⇒ el ruido es siempre '0', así la secuencia es verificable.
const alwaysZero = () => 0;

const BYTES: HeroByte[] = [
  { bits: '01100010', char: 'b' },
  { bits: '01111001', char: 'y' },
];

describe('settledBits', () => {
  it('no fija ningún bit antes de que le toque el turno a la fila', () => {
    expect(settledBits(1, 0)).toBe(0);
  });

  it('va fijando un bit por cuadro', () => {
    expect(settledBits(0, 3)).toBe(3);
  });

  it('desfasa cada fila respecto de la anterior', () => {
    expect(settledBits(1, STAGGER_FRAMES + 2)).toBe(2);
  });

  it('deja la fila quieta una vez que cayó entera', () => {
    expect(settledBits(0, 400)).toBe(BITS_PER_BYTE);
  });
});

describe('totalDecodeFrames', () => {
  it('cubre el último byte incluido su desfase', () => {
    expect(totalDecodeFrames(2)).toBe(STAGGER_FRAMES + BITS_PER_BYTE);
  });

  it('una sola fila dura lo que dura su byte', () => {
    expect(totalDecodeFrames(1)).toBe(BITS_PER_BYTE);
  });

  it('sin filas no hay cascada', () => {
    expect(totalDecodeFrames(0)).toBe(0);
  });
});

describe('decodeFrame', () => {
  it('mezcla los bits ya caídos con ruido para los que faltan', () => {
    expect(decodeFrame(BYTES, 3, alwaysZero)[0].bits).toBe('011' + '00000');
  });

  it('no muestra la letra hasta que el byte cayó entero', () => {
    expect(decodeFrame(BYTES, 3, alwaysZero)[0].char).toBe('');
  });

  it('enciende la letra recién con el byte completo', () => {
    const [first] = decodeFrame(BYTES, BITS_PER_BYTE, alwaysZero);
    expect(first).toEqual({ bits: '01100010', char: 'b', settled: true });
  });

  it('llega a la columna completa en el último cuadro', () => {
    const last = decodeFrame(BYTES, totalDecodeFrames(BYTES.length), alwaysZero);
    expect(last).toEqual(settledColumn(BYTES));
  });
});

describe('settledColumn', () => {
  it('devuelve cada byte con su letra y ya asentado', () => {
    expect(settledColumn(BYTES)).toEqual([
      { bits: '01100010', char: 'b', settled: true },
      { bits: '01111001', char: 'y', settled: true },
    ]);
  });
});
