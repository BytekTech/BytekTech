/** Desaceleración: arranca rápido y se asienta en el valor final sin rebote. */
export function easeOutCubic(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Valor a mostrar en un punto del conteo. Redondea hacia abajo para que la
 * cifra final se alcance exactamente al terminar y no un cuadro antes.
 */
export function countUpValue(target: number, progress: number): number {
  if (progress >= 1) {
    return target;
  }
  return Math.floor(target * easeOutCubic(progress));
}
