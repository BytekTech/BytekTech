import { validateSection } from './content.validation';
import { ICON_MAX_BYTES, ICON_MIN_PIXELS } from '../../app/domain/models/client-icon';

function dataUri(mime: string, bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/** Un PNG con la cabecera real: alcanza para que se le lea la medida. */
function png(side: number, padding = 0): Uint8Array {
  const bytes = new Uint8Array(24 + padding);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[11] = 13;
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  bytes[16] = (side >>> 24) & 0xff;
  bytes[17] = (side >>> 16) & 0xff;
  bytes[18] = (side >>> 8) & 0xff;
  bytes[19] = side & 0xff;
  bytes.set(bytes.slice(16, 20), 20);
  return bytes;
}

function svgIcon(body: string): string {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`;
  return dataUri('image/svg+xml', new TextEncoder().encode(source));
}

function client(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'nodo',
    name: 'Nodo Logística',
    since: 2023,
    brandColor: '#e8590c',
    copy: {
      es: { industry: 'Logística', summary: 'Panel de flota.' },
      en: { industry: 'Logistics', summary: 'Fleet panel.' },
      ...((overrides['copy'] as object) ?? {}),
    },
    ...overrides,
  };
}

describe('validateSection', () => {
  it('acepta una colección bien formada y la devuelve recortada al dominio', () => {
    const result = validateSection('clients', [client({ apodo: 'campo de más' })]);

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(Object.keys(result.value[0])).not.toContain('apodo');
    }
  });

  it('rechaza un color que intente arrastrar otra declaración de CSS', () => {
    const result = validateSection('clients', [
      client({ brandColor: 'red;background:url(javascript:alert(1))' }),
    ]);

    expect(result).toEqual({ ok: false, error: 'INVALID_ITEM' });
  });

  it('rechaza un enlace que no sea http o https', () => {
    expect(validateSection('clients', [client({ website: 'javascript:alert(1)' })]).ok).toBeFalse();
    expect(validateSection('clients', [client({ website: 'https://nodo.com' })]).ok).toBeTrue();
  });

  it('exige los dos idiomas', () => {
    const incompleto = client();
    incompleto['copy'] = { es: { industry: 'Logística', summary: 'Panel.' } };

    expect(validateSection('clients', [incompleto])).toEqual({ ok: false, error: 'INVALID_ITEM' });
  });

  it('no deja pasar dos entradas con el mismo identificador', () => {
    const result = validateSection('clients', [client(), client({ name: 'Otro' })]);

    expect(result).toEqual({ ok: false, error: 'DUPLICATE_ID' });
  });

  it('rechaza identificadores que no sirvan como clave de una lista', () => {
    expect(validateSection('clients', [client({ id: 'Con Mayúsculas' })]).ok).toBeFalse();
    expect(validateSection('clients', [client({ id: '' })]).ok).toBeFalse();
  });

  it('acepta los campos opcionales vacíos y los deja sin definir', () => {
    const result = validateSection('clients', [client({ website: '', brandColor: '' })]);

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.value[0].website).toBeUndefined();
      expect(result.value[0].brandColor).toBeUndefined();
    }
  });

  /*
   * El icono viaja embebido dentro del contenido, y el contenido dentro del
   * HTML de cada visita. Acá no se le cree nada a quien lo manda: la medida se
   * lee de la cabecera del propio archivo.
   */
  it('acepta un icono que cumple formato, peso y medida', () => {
    const result = validateSection('clients', [
      client({ icon: dataUri('image/png', png(ICON_MIN_PIXELS)) }),
    ]);

    expect(result.ok).toBeTrue();
  });

  it('acepta un vector, que es el que no pierde resolución', () => {
    expect(validateSection('clients', [client({ icon: svgIcon('<circle r="5"/>') })]).ok).toBeTrue();
  });

  it('rechaza un icono en un formato que no se acepta', () => {
    const gif = dataUri('image/gif', png(ICON_MIN_PIXELS));

    expect(validateSection('clients', [client({ icon: gif })]).ok).toBeFalse();
  });

  it('rechaza un icono que se vería blando por chico', () => {
    const chico = dataUri('image/png', png(ICON_MIN_PIXELS - 1));

    expect(validateSection('clients', [client({ icon: chico })]).ok).toBeFalse();
  });

  it('rechaza un icono que pesa de más', () => {
    const gordo = dataUri('image/png', png(ICON_MIN_PIXELS, ICON_MAX_BYTES));

    expect(validateSection('clients', [client({ icon: gordo })]).ok).toBeFalse();
  });

  it('rechaza un vector con código adentro', () => {
    const conScript = svgIcon('<script>alert(1)</script>');

    expect(validateSection('clients', [client({ icon: conScript })]).ok).toBeFalse();
  });

  it('rechaza un icono que no sea un data URI', () => {
    const ajeno = 'https://ajeno.example/logo.png';

    expect(validateSection('clients', [client({ icon: ajeno })]).ok).toBeFalse();
  });

  it('acepta el icono vacío y lo deja sin definir', () => {
    const result = validateSection('clients', [client({ icon: '' })]);

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.value[0].icon).toBeUndefined();
    }
  });

  it('valida el byte de un servicio como ceros y unos', () => {
    const service = (bits: string) => ({
      id: 'web',
      bits,
      copy: {
        es: { name: 'Web', description: 'Aplicaciones.', deliverables: ['Una app'] },
        en: { name: 'Web', description: 'Applications.', deliverables: ['An app'] },
      },
    });

    expect(validateSection('services', [service('01100010')]).ok).toBeTrue();
    expect(validateSection('services', [service('nada')]).ok).toBeFalse();
  });

  it('rechaza lo que no sea una colección y lo que se pase de largo', () => {
    expect(validateSection('clients', { id: 'nodo' })).toEqual({
      ok: false,
      error: 'INVALID_COLLECTION',
    });
    const demasiados = Array.from({ length: 61 }, (_, index) => client({ id: `cliente-${index}` }));
    expect(validateSection('clients', demasiados)).toEqual({ ok: false, error: 'TOO_MANY_ITEMS' });
  });

  it('exige que las métricas traigan un número entero dentro de rango', () => {
    const metric = (value: unknown) => ({
      id: 'proyectos',
      value,
      copy: {
        es: { label: 'Proyectos', detail: 'Entregados' },
        en: { label: 'Projects', detail: 'Delivered' },
      },
    });

    expect(validateSection('metrics', [metric(40)]).ok).toBeTrue();
    expect(validateSection('metrics', [metric(4.5)]).ok).toBeFalse();
    expect(validateSection('metrics', [metric('40')]).ok).toBeFalse();
    expect(validateSection('metrics', [metric(-1)]).ok).toBeFalse();
  });
});
