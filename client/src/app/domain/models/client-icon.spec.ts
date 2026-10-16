import {
  ICON_MAX_BYTES,
  ICON_MAX_PIXELS,
  ICON_MIN_PIXELS,
  iconIssue,
  parseIconDataUri,
  readPixelSize,
  svgLooksUnsafe,
} from './client-icon';

function dataUri(mime: string, bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function writeUint32BE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function writeUint24LE(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
}

/** Un PNG con la cabecera real y nada más: alcanza para leerle la medida. */
function png(width: number, height: number, padding = 0): Uint8Array {
  const bytes = new Uint8Array(24 + padding);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  writeUint32BE(bytes, 8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  writeUint32BE(bytes, 16, width);
  writeUint32BE(bytes, 20, height);
  return bytes;
}

function webpExtended(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x58], 12);
  writeUint24LE(bytes, 24, width - 1);
  writeUint24LE(bytes, 27, height - 1);
  return bytes;
}

function webpLossy(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x20], 12);
  bytes.set([0x9d, 0x01, 0x2a], 23);
  bytes[26] = width & 0xff;
  bytes[27] = (width >> 8) & 0x3f;
  bytes[28] = height & 0xff;
  bytes[29] = (height >> 8) & 0x3f;
  return bytes;
}

function webpLossless(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);
  bytes.set([0x56, 0x50, 0x38, 0x4c], 12);
  bytes[20] = 0x2f;
  const packed = (width - 1) | ((height - 1) << 14);
  bytes[21] = packed & 0xff;
  bytes[22] = (packed >>> 8) & 0xff;
  bytes[23] = (packed >>> 16) & 0xff;
  bytes[24] = (packed >>> 24) & 0xff;
  return bytes;
}

function svg(body: string): Uint8Array {
  return new TextEncoder().encode(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`,
  );
}

describe('parseIconDataUri', () => {
  it('separa el formato de los bytes', () => {
    const parsed = parseIconDataUri(dataUri('image/png', png(256, 256)));

    expect(parsed?.format).toBe('image/png');
    expect(parsed?.bytes.length).toBe(24);
  });

  it('rechaza un formato que no está en la lista', () => {
    expect(parseIconDataUri(dataUri('image/gif', png(256, 256)))).toBeNull();
  });

  it('rechaza lo que no es un data URI en base64', () => {
    expect(parseIconDataUri('https://tomasssale.com/logo.png')).toBeNull();
    expect(parseIconDataUri('data:image/png,no-va-en-base64')).toBeNull();
  });
});

describe('readPixelSize', () => {
  it('le lee la medida a un PNG', () => {
    const icon = parseIconDataUri(dataUri('image/png', png(320, 480)));

    expect(readPixelSize(icon!)).toEqual({ width: 320, height: 480 });
  });

  it('le lee la medida a un WebP extendido', () => {
    const icon = parseIconDataUri(dataUri('image/webp', webpExtended(300, 400)));

    expect(readPixelSize(icon!)).toEqual({ width: 300, height: 400 });
  });

  it('le lee la medida a un WebP con pérdida', () => {
    const icon = parseIconDataUri(dataUri('image/webp', webpLossy(300, 400)));

    expect(readPixelSize(icon!)).toEqual({ width: 300, height: 400 });
  });

  it('le lee la medida a un WebP sin pérdida', () => {
    const icon = parseIconDataUri(dataUri('image/webp', webpLossless(300, 400)));

    expect(readPixelSize(icon!)).toEqual({ width: 300, height: 400 });
  });

  // El vector no tiene medida en píxeles, y es justamente su gracia.
  it('no le busca medida al vector', () => {
    const icon = parseIconDataUri(dataUri('image/svg+xml', svg('<rect width="10" height="10"/>')));

    expect(readPixelSize(icon!)).toBeNull();
  });
});

describe('svgLooksUnsafe', () => {
  it('deja pasar un dibujo', () => {
    expect(svgLooksUnsafe(svg('<path d="M0 0 L10 10"/>'))).toBeFalse();
  });

  it('frena un script incrustado', () => {
    expect(svgLooksUnsafe(svg('<script>alert(1)</script>'))).toBeTrue();
  });

  it('frena un manejador de evento', () => {
    expect(svgLooksUnsafe(svg('<rect onload="alert(1)"/>'))).toBeTrue();
  });

  it('frena contenido HTML incrustado', () => {
    expect(svgLooksUnsafe(svg('<foreignObject><div/></foreignObject>'))).toBeTrue();
  });

  it('frena una referencia a otro servidor', () => {
    expect(svgLooksUnsafe(svg('<use href="https://ajeno.example/x.svg#a"/>'))).toBeTrue();
  });

  it('frena una entidad externa', () => {
    expect(svgLooksUnsafe(new TextEncoder().encode('<!ENTITY x SYSTEM "file:///etc/passwd">'))).toBeTrue();
  });
});

describe('iconIssue', () => {
  it('acepta un PNG de la medida pedida', () => {
    expect(iconIssue(dataUri('image/png', png(ICON_MIN_PIXELS, ICON_MIN_PIXELS)))).toBeNull();
  });

  it('acepta un vector limpio', () => {
    expect(iconIssue(dataUri('image/svg+xml', svg('<circle r="5"/>')))).toBeNull();
  });

  // El icono es opcional: sin él la marca se dibuja con el patrón generado.
  it('no tiene nada contra un icono ausente', () => {
    expect(iconIssue('')).toBeNull();
    expect(iconIssue('   ')).toBeNull();
  });

  it('rechaza un formato que no se acepta', () => {
    expect(iconIssue(dataUri('image/gif', png(256, 256)))).toBe('format');
  });

  it('rechaza el que pesa de más', () => {
    const gordo = png(ICON_MIN_PIXELS, ICON_MIN_PIXELS, ICON_MAX_BYTES);

    expect(iconIssue(dataUri('image/png', gordo))).toBe('weight');
  });

  it('rechaza el que se vería blando por chico', () => {
    const chico = ICON_MIN_PIXELS - 1;

    expect(iconIssue(dataUri('image/png', png(chico, ICON_MIN_PIXELS)))).toBe('tooSmall');
  });

  it('rechaza el que es más grande de lo que agrega nitidez', () => {
    const grande = ICON_MAX_PIXELS + 1;

    expect(iconIssue(dataUri('image/png', png(grande, grande)))).toBe('tooLarge');
  });

  it('rechaza el mapa de bits con la cabecera rota', () => {
    expect(iconIssue(dataUri('image/png', new Uint8Array(40)))).toBe('unreadable');
  });

  it('rechaza el vector con un script adentro', () => {
    expect(iconIssue(dataUri('image/svg+xml', svg('<script>alert(1)</script>')))).toBe('unsafe');
  });
});
