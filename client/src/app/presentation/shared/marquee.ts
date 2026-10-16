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
 * Tope de marcas en la cinta, contando las copias. El límite que importa es
 * cuántos nodos termina teniendo la fila, no cuántas veces se repite el
 * listado: con una lista corta cada copia mide poco y hacen falta muchas para
 * tapar una pantalla ancha, así que topear las copias dejaba el hueco a la
 * vista justo en el caso que el tope pretendía cubrir.
 */
export const MAX_MARKS = 240;

/** Copias mínimas para que el bucle cierre: una corre mientras la otra entra. */
const MIN_COPIES = 2;

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
 *
 * `itemCount` entra en la cuenta para que el tope sea de marcas y no de copias:
 * un listado de una sola marca puede repetirse muchas veces sin que la cinta
 * engorde, y es el que más repeticiones necesita.
 */
export function copiesNeeded(
  viewportWidth: number,
  copyWidth: number,
  itemCount: number,
): number {
  if (copyWidth <= 0 || itemCount <= 0) {
    return 1;
  }

  const needed = Math.ceil(viewportWidth / copyWidth) + 1;
  const affordable = Math.floor(MAX_MARKS / itemCount);
  // El mínimo manda sobre el tope: sin dos copias no hay bucle, por larga que
  // sea la lista.
  return Math.max(Math.min(needed, affordable), MIN_COPIES);
}
