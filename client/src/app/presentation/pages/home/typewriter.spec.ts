import {
  nextTypewriterState,
  TYPEWRITER_START,
  TypewriterState,
  typewriterDelay,
  typewriterText,
} from './typewriter';

const PHRASES = ['tu empresa.', 'tu negocio.', 'tu idea.', 'tu futuro.'];

/** Reproduce el ciclo y devuelve el texto visible en cada paso. */
function run(steps: number, phrases = PHRASES): string[] {
  let state: TypewriterState = TYPEWRITER_START;
  const seen: string[] = [];

  for (let i = 0; i < steps; i++) {
    seen.push(typewriterText(state, phrases));
    state = nextTypewriterState(state, phrases);
  }
  return seen;
}

describe('nextTypewriterState', () => {
  it('escribe la primera frase carácter a carácter', () => {
    expect(run(5)).toEqual(['', 't', 'tu', 'tu ', 'tu e']);
  });

  it('sostiene la frase completa antes de borrarla', () => {
    const seen = run(40);
    const completa = seen.filter((text) => text === 'tu empresa.');

    expect(completa.length).toBeGreaterThanOrEqual(2);
  });

  it('borra hasta vaciar y pasa a la frase siguiente', () => {
    let state: TypewriterState = TYPEWRITER_START;
    const textos: string[] = [];

    for (let i = 0; i < 60; i++) {
      state = nextTypewriterState(state, PHRASES);
      textos.push(typewriterText(state, PHRASES));
    }

    expect(textos).toContain('');
    expect(textos.some((text) => text.startsWith('tu n'))).toBeTrue();
  });

  it('vuelve a la primera frase después de la última', () => {
    let state: TypewriterState = { phrase: PHRASES.length - 1, length: 0, phase: 'deleting' };
    state = nextTypewriterState(state, PHRASES);

    expect(state.phrase).toBe(0);
    expect(state.phase).toBe('typing');
  });

  it('nunca muestra un texto que no pertenezca a alguna frase', () => {
    for (const text of run(200)) {
      expect(PHRASES.some((phrase) => phrase.startsWith(text))).toBeTrue();
    }
  });

  it('con una sola frase la deja escrita y no la borra', () => {
    const una = ['tu empresa.'];
    let state: TypewriterState = { phrase: 0, length: una[0].length, phase: 'holding' };

    state = nextTypewriterState(state, una);

    expect(state.phase).toBe('holding');
    expect(typewriterText(state, una)).toBe('tu empresa.');
  });
});

describe('typewriterDelay', () => {
  it('borra más rápido de lo que escribe', () => {
    const escribiendo = typewriterDelay({ phrase: 0, length: 3, phase: 'typing' }, PHRASES);
    const borrando = typewriterDelay({ phrase: 0, length: 3, phase: 'deleting' }, PHRASES);

    expect(borrando).toBeLessThan(escribiendo);
  });

  it('la pausa con la frase completa es la más larga', () => {
    const sosteniendo = typewriterDelay({ phrase: 0, length: 11, phase: 'holding' }, PHRASES);
    const escribiendo = typewriterDelay({ phrase: 0, length: 3, phase: 'typing' }, PHRASES);

    expect(sosteniendo).toBeGreaterThan(escribiendo * 5);
  });

  it('deja un respiro entre una frase y la siguiente', () => {
    const cambio = typewriterDelay({ phrase: 0, length: 0, phase: 'deleting' }, PHRASES);
    const borrando = typewriterDelay({ phrase: 0, length: 5, phase: 'deleting' }, PHRASES);

    expect(cambio).toBeGreaterThan(borrando);
  });
});
