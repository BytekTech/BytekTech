import { scrambleFrames } from './scramble';

// random() fijo en 0 ⇒ siempre el primer carácter del pool: '0'.
const alwaysFirst = () => 0;

describe('scrambleFrames', () => {
  it('revela el texto de izquierda a derecha', () => {
    const frames = scrambleFrames('bytek', alwaysFirst);
    const revealed = frames.map((frame) => frame.replace(/0+$/, '').length);

    expect(revealed).toEqual([...revealed].sort((a, b) => a - b));
  });

  it('mantiene la longitud del texto original en todos los cuadros', () => {
    const target = 'tu empresa.';
    for (const frame of scrambleFrames(target, alwaysFirst)) {
      expect(frame.length).toBe(target.length);
    }
  });

  it('conserva los espacios en su posición', () => {
    const frames = scrambleFrames('a b', alwaysFirst);

    for (const frame of frames) {
      expect(frame[1]).toBe(' ');
    }
  });

  it('nunca emite el texto ya completo: el último cuadro sigue teniendo ruido', () => {
    const target = 'bytek';
    const frames = scrambleFrames(target, alwaysFirst);

    expect(frames.length).toBeGreaterThan(0);
    expect(frames).not.toContain(target);
  });

  it('no genera cuadros para un texto vacío', () => {
    expect(scrambleFrames('', alwaysFirst)).toEqual([]);
  });
});
