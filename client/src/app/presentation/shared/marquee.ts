/**
 * Aritmética del carrusel infinito. Vive fuera del DOM a propósito: así el
 * bucle —lo único que puede quedar mal— se prueba sin navegador, y la directiva
 * se limita a traducir estos números a píxeles.
 */

/** Sentido de la marcha de la cinta. */
export type MarqueeDirection = 'left' | 'right';

/** Un cuadro perdido —pestaña en segundo plano, hilo ocupado— no debe volverse un salto. */
export const MAX_FRAME_MS = 64;

/**
 * Tope de copias del listado: más allá de esto el hueco ya no es el problema.
 * Da para tapar una pantalla ancha aun con una lista de un solo elemento, que
 * es el caso en el que cada copia mide poco y hacen falta muchas.
 */
export const MAX_COPIES = 20;

/**
 * Envuelve una posición dentro del bucle `[0, span)`. Al pasar el final vuelve
 * al principio, y al arrastrar hacia atrás entra por el otro extremo: como las
 * copias son idénticas, el salto no se ve.
 */
export function wrapOffset(offset: number, span: number): number {
  if (span <= 0) {
    return 0;
  }
  return ((offset % span) + span) % span;
}

/** Distancia que avanza el carrusel en un cuadro, a velocidad constante. */
export function frameDistance(elapsedMs: number, pixelsPerSecond: number): number {
  const elapsed = Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS);
  return (elapsed * pixelsPerSecond) / 1000;
}

/**
 * Signo del avance según el sentido. La cinta que corre hacia la derecha
 * recorre el mismo bucle al revés: no hace falta otra rama de código, alcanza
 * con restar en vez de sumar.
 */
export function directionSign(direction: MarqueeDirection): number {
  return direction === 'right' ? -1 : 1;
}

/**
 * Cuántas veces repetir el listado para que, corrido el ancho de una copia, el
 * resto siga tapando la ventana. Con menos copias el bucle deja un hueco.
 */
export function copiesNeeded(viewportWidth: number, copyWidth: number): number {
  if (copyWidth <= 0) {
    return 1;
  }
  const needed = Math.ceil(viewportWidth / copyWidth) + 1;
  return Math.min(Math.max(needed, 2), MAX_COPIES);
}
