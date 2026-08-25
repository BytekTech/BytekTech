import { validateSection } from './content.validation';

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
