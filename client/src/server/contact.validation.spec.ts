import { isHoneypotTripped, MAX_LENGTHS, validatePayload, escapeHtml } from './contact.validation';

const valid = {
  name: 'Ana Pérez',
  email: 'ana@empresa.com',
  message: 'Necesitamos un panel de gestión.',
};

describe('validatePayload', () => {
  it('acepta un envío completo y normaliza la empresa vacía a undefined', () => {
    const result = validatePayload({ ...valid, company: '   ' });

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.fields.company).toBeUndefined();
      expect(result.fields.email).toBe('ana@empresa.com');
    }
  });

  it('rechaza nombre o mensaje vacíos', () => {
    expect(validatePayload({ ...valid, name: '   ' })).toEqual({
      ok: false,
      error: 'INVALID_FIELDS',
    });
    expect(validatePayload({ ...valid, message: '' })).toEqual({
      ok: false,
      error: 'INVALID_FIELDS',
    });
  });

  it('rechaza emails mal formados', () => {
    for (const email of ['sin-arroba', 'a@b', 'a@b.', '@dominio.com']) {
      expect(validatePayload({ ...valid, email })).toEqual({
        ok: false,
        error: 'INVALID_EMAIL',
      });
    }
  });

  it('rechaza campos que exceden el largo máximo', () => {
    const result = validatePayload({ ...valid, message: 'x'.repeat(MAX_LENGTHS.message + 1) });

    expect(result).toEqual({ ok: false, error: 'FIELD_TOO_LONG' });
  });

  it('acepta un mensaje justo en el límite', () => {
    expect(validatePayload({ ...valid, message: 'x'.repeat(MAX_LENGTHS.message) }).ok).toBeTrue();
  });

  it('rechaza valores que no son texto', () => {
    expect(validatePayload({ ...valid, name: 42 }).ok).toBeFalse();
    expect(validatePayload({ ...valid, email: null }).ok).toBeFalse();
  });
});

describe('isHoneypotTripped', () => {
  it('detecta la trampa completada', () => {
    expect(isHoneypotTripped({ ...valid, website: 'http://spam.example' })).toBeTrue();
  });

  it('deja pasar los envíos con la trampa vacía o ausente', () => {
    expect(isHoneypotTripped({ ...valid, website: '' })).toBeFalse();
    expect(isHoneypotTripped(valid)).toBeFalse();
    expect(isHoneypotTripped(undefined)).toBeFalse();
  });
});

describe('escapeHtml', () => {
  it('neutraliza el marcado que llegue en el mensaje', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });

  it('escapa las comillas simples, usadas para romper atributos', () => {
    expect(escapeHtml("onclick='x'")).toBe('onclick=&#39;x&#39;');
  });
});
