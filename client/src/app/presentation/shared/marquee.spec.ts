import {
  copiesNeeded,
  directionSign,
  frameDistance,
  MAX_COPIES,
  MAX_FRAME_MS,
  wrapOffset,
} from './marquee';

describe('wrapOffset', () => {
  it('deja la posición como está dentro del bucle', () => {
    expect(wrapOffset(30, 100)).toBe(30);
  });

  it('vuelve al principio al pasar el final', () => {
    expect(wrapOffset(130, 100)).toBe(30);
  });

  it('entra por el otro extremo al arrastrar hacia atrás', () => {
    expect(wrapOffset(-30, 100)).toBe(70);
  });

  it('no divide por un bucle vacío', () => {
    expect(wrapOffset(30, 0)).toBe(0);
  });
});

describe('frameDistance', () => {
  it('avanza en proporción a lo que duró el cuadro', () => {
    expect(frameDistance(16, 1000)).toBe(16);
  });

  it('recorta el cuadro perdido para no dar un salto', () => {
    expect(frameDistance(4000, 1000)).toBe(MAX_FRAME_MS);
  });

  it('ignora un reloj que va para atrás', () => {
    expect(frameDistance(-16, 40)).toBe(0);
  });
});

describe('directionSign', () => {
  it('avanza el bucle para la cinta que va hacia la izquierda', () => {
    expect(directionSign('left')).toBe(1);
  });

  it('lo recorre al revés para la que va hacia la derecha', () => {
    expect(directionSign('right')).toBe(-1);
  });
});

describe('copiesNeeded', () => {
  it('usa dos copias cuando una ya tapa la ventana', () => {
    expect(copiesNeeded(800, 900)).toBe(2);
  });

  it('agrega copias cuando el listado es más corto que la ventana', () => {
    expect(copiesNeeded(1600, 400)).toBe(5);
  });

  it('se planta en un tope de copias', () => {
    expect(copiesNeeded(100000, 10)).toBe(MAX_COPIES);
  });

  it('no clona nada sin medida del listado', () => {
    expect(copiesNeeded(1600, 0)).toBe(1);
  });
});
