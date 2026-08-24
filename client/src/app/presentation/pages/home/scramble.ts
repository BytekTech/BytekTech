const SCRAMBLE_POOL = '01<>{}#/';
const MIN_FRAMES = 14;
const FRAMES_PER_CHAR = 0.85;

/**
 * Cuadros del efecto de decodificado del título: el texto se revela de
 * izquierda a derecha mientras lo que falta sigue siendo ruido. El último
 * cuadro nunca es el texto completo — de eso se encarga quien lo reproduce,
 * volviendo al valor original.
 *
 * `random` se inyecta para poder verificar la secuencia de forma determinista.
 */
export function scrambleFrames(target: string, random: () => number = Math.random): string[] {
  const totalFrames = Math.max(MIN_FRAMES, Math.ceil(target.length * FRAMES_PER_CHAR));
  const frames: string[] = [];

  for (let frame = 1; frame <= totalFrames; frame++) {
    const resolved = Math.floor((frame / totalFrames) * target.length);
    if (resolved >= target.length) {
      break;
    }
    frames.push(target.slice(0, resolved) + noise(target, resolved, random));
  }

  return frames;
}

/** Ruido para la parte aún no revelada, respetando los espacios del original. */
function noise(target: string, from: number, random: () => number): string {
  let text = '';
  for (let i = from; i < target.length; i++) {
    text +=
      target[i] === ' ' ? ' ' : SCRAMBLE_POOL[Math.floor(random() * SCRAMBLE_POOL.length)];
  }
  return text;
}
