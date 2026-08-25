/**
 * Desaceleración de la cuenta. La potencia alta hace que el grueso del recorrido
 * pase en el primer tercio del tiempo y que las últimas cifras se acomoden
 * despacio: la cuenta entra a fondo y llega apoyando, que es donde el ojo se
 * detiene a leer el número.
 */
export function easeOutQuint(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return 1 - Math.pow(1 - clamped, 5);
}

/**
 * Valor a mostrar en un punto del conteo. Redondea hacia abajo para que la
 * cifra final se alcance exactamente al terminar y no un cuadro antes.
 */
export function countUpValue(target: number, progress: number): number {
  if (progress >= 1) {
    return target;
  }
  return Math.floor(target * easeOutQuint(progress));
}
