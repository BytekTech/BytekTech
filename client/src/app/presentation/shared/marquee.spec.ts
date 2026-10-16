import {
  copiesNeeded,
  directionSign,
  frameDistance,
  MAX_FRAME_MS,
  MAX_MARKS,
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
    expect(copiesNeeded(800, 900, 6)).toBe(2);
  });

  it('agrega copias cuando el listado es más corto que la ventana', () => {
    expect(copiesNeeded(1600, 400, 3)).toBe(5);
  });

  // El caso que dejaba el hueco a la vista: una sola marca en un monitor ancho
  // necesita más repeticiones que las que permitía el viejo tope de copias.
  it('tapa una pantalla ancha con un listado de una sola marca', () => {
    const copyWidth = 136;
    const viewportWidth = 3440;
    const copies = copiesNeeded(viewportWidth, copyWidth, 1);

    // Corrida una copia entera, lo que queda todavía tiene que tapar la ventana.
    expect((copies - 1) * copyWidth).toBeGreaterThanOrEqual(viewportWidth);
  });

  it('se planta en un tope de marcas, no de copias', () => {
    expect(copiesNeeded(100000, 10, 1)).toBe(MAX_MARKS);
    expect(copiesNeeded(100000, 10, 4)).toBe(MAX_MARKS / 4);
  });

  it('conserva las dos copias del bucle aunque el listado pase el tope', () => {
    expect(copiesNeeded(1600, 4000, MAX_MARKS * 2)).toBe(2);
  });

  it('no clona nada sin medida del listado', () => {
    expect(copiesNeeded(1600, 0, 3)).toBe(1);
  });

  it('no clona nada con el listado vacío', () => {
    expect(copiesNeeded(1600, 400, 0)).toBe(1);
  });
});
