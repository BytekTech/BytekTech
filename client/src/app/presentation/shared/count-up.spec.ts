import { countUpValue, easeOutCubic } from './count-up';

describe('easeOutCubic', () => {
  it('va de 0 a 1 sin pasarse', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('desacelera: en la mitad del tiempo ya recorrió más de la mitad', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('acota valores fuera de rango', () => {
    expect(easeOutCubic(-2)).toBe(0);
    expect(easeOutCubic(9)).toBe(1);
  });
});

describe('countUpValue', () => {
  it('arranca en cero y termina exactamente en el destino', () => {
    expect(countUpValue(48, 0)).toBe(0);
    expect(countUpValue(48, 1)).toBe(48);
  });

  it('nunca supera el destino durante el conteo', () => {
    for (let step = 0; step <= 20; step++) {
      expect(countUpValue(20, step / 20)).toBeLessThanOrEqual(20);
    }
  });

  it('avanza de forma monótona', () => {
    const values = Array.from({ length: 21 }, (_, step) => countUpValue(48, step / 20));

    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('devuelve enteros, no decimales a medio contar', () => {
    expect(countUpValue(6, 0.37) % 1).toBe(0);
  });

  it('se queda en el destino si el progreso se pasa de 1', () => {
    expect(countUpValue(6, 1.8)).toBe(6);
  });
});
