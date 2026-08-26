/**
 * Decodificado de la columna de bytes del hero: los bits se agitan y se van
 * fijando de izquierda a derecha hasta que el byte queda entero y recién ahí
 * aparece su letra. Es el mismo gesto que hace el título, pero contado en la
 * unidad de la casa.
 *
 * Vive fuera del componente a propósito: la cuenta de cuántos bits ya cayeron
 * —lo único que puede quedar mal— se prueba sin navegador.
 */

/** Bits que ocupa un carácter ASCII. */
export const BITS_PER_BYTE = 8;

/** Desfase entre una fila y la siguiente: las letras caen en cascada, no a la vez. */
export const STAGGER_FRAMES = 3;

export interface HeroByte {
  /** Los ocho bits definitivos del carácter. */
  bits: string;
  char: string;
}

export interface DecodingByte {
  /** Los ocho bits tal como se ven en este cuadro, ruido incluido. */
  bits: string;
  /** La letra, sólo una vez que su byte terminó de caer. */
  char: string;
  settled: boolean;
}

/** Cuántos cuadros dura la cascada completa. */
export function totalDecodeFrames(byteCount: number): number {
  if (byteCount <= 0) {
    return 0;
  }
  return (byteCount - 1) * STAGGER_FRAMES + BITS_PER_BYTE;
}

/**
 * Cuántos bits de una fila ya cayeron en el cuadro dado. Antes de que le toque
 * el turno la fila es puro ruido; pasado su tramo queda fija.
 */
export function settledBits(index: number, frame: number): number {
  const progress = frame - index * STAGGER_FRAMES;
  return Math.min(Math.max(progress, 0), BITS_PER_BYTE);
}

/**
 * La columna entera en un cuadro. `random` se inyecta para poder verificar la
 * secuencia de forma determinista.
 */
export function decodeFrame(
  bytes: readonly HeroByte[],
  frame: number,
  random: () => number = Math.random,
): DecodingByte[] {
  return bytes.map((byte, index) => {
    const settled = settledBits(index, frame);
    return {
      bits: byte.bits.slice(0, settled) + noise(BITS_PER_BYTE - settled, random),
      char: settled === BITS_PER_BYTE ? byte.char : '',
      settled: settled === BITS_PER_BYTE,
    };
  });
}

/** La columna ya resuelta: es lo que sirve el servidor y lo que queda al final. */
export function settledColumn(bytes: readonly HeroByte[]): DecodingByte[] {
  return bytes.map((byte) => ({ bits: byte.bits, char: byte.char, settled: true }));
}

/** Ruido binario para los bits que todavía no cayeron. */
function noise(length: number, random: () => number): string {
  let bits = '';
  for (let i = 0; i < length; i++) {
    bits += random() < 0.5 ? '0' : '1';
  }
  return bits;
}
