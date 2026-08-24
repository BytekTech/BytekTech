export type TypewriterPhase = 'typing' | 'holding' | 'deleting';

export interface TypewriterState {
  /** Índice de la frase dentro de la lista. */
  phrase: number;
  /** Cuántos caracteres de esa frase están escritos. */
  length: number;
  phase: TypewriterPhase;
}

export const TYPEWRITER_START: TypewriterState = { phrase: 0, length: 0, phase: 'typing' };

const TYPE_MS = 120;
const DELETE_MS = 60;
const HOLD_MS = 2200;
/** Respiro entre borrar del todo y empezar la frase siguiente. */
const SWITCH_MS = 400;

/**
 * Avanza un paso el ciclo de escritura: escribe la frase carácter a carácter,
 * la sostiene, la borra y pasa a la siguiente, volviendo a la primera al final.
 *
 * Es una función pura sobre el estado, así el ritmo y los cortes se verifican
 * sin depender de temporizadores ni del DOM.
 */
export function nextTypewriterState(
  state: TypewriterState,
  phrases: readonly string[],
): TypewriterState {
  const current = phrases[state.phrase] ?? '';

  switch (state.phase) {
    case 'typing':
      if (state.length >= current.length) {
        return { ...state, phase: 'holding' };
      }
      return { ...state, length: state.length + 1 };

    case 'holding':
      // Con una sola frase no hay nada que rotar: se queda escrita.
      return phrases.length > 1 ? { ...state, phase: 'deleting' } : state;

    case 'deleting':
      if (state.length <= 0) {
        return {
          phrase: (state.phrase + 1) % phrases.length,
          length: 0,
          phase: 'typing',
        };
      }
      return { ...state, length: state.length - 1 };
  }
}

/** Cuánto esperar antes de aplicar el paso siguiente. */
export function typewriterDelay(state: TypewriterState, phrases: readonly string[]): number {
  switch (state.phase) {
    case 'holding':
      return HOLD_MS;
    case 'deleting':
      return state.length <= 0 ? SWITCH_MS : DELETE_MS;
    case 'typing':
      return state.length >= (phrases[state.phrase]?.length ?? 0) ? HOLD_MS : TYPE_MS;
  }
}

export function typewriterText(state: TypewriterState, phrases: readonly string[]): string {
  return (phrases[state.phrase] ?? '').slice(0, state.length);
}
