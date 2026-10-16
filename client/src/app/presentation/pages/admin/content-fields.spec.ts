import {
  blocksPublishing,
  EditableItem,
  fieldIssue,
  itemBlocksPublishing,
  langBlocksPublishing,
  specFor,
} from './content-fields';

const clients = specFor('clients');
const services = specFor('services');

function fieldOf(section: typeof clients, key: string) {
  const field = section.fields.find((candidate) => candidate.key === key);
  if (!field) {
    throw new Error(`El test apunta a un campo que no existe: ${key}`);
  }
  return field;
}

/** Un cliente que el servidor aceptaría tal cual. */
function completeClient(): EditableItem {
  return {
    id: 'nodo',
    name: 'Nodo Logística',
    since: 2023,
    website: 'https://nodo.example',
    brandColor: '#e8590c',
    copy: {
      es: { industry: 'Logística', summary: 'Un panel único de flota.' },
      en: { industry: 'Logistics', summary: 'A single fleet panel.' },
    },
  };
}

describe('blocksPublishing', () => {
  it('frena por un campo obligatorio vacío', () => {
    const item = { ...completeClient(), name: '' };

    expect(blocksPublishing(item, fieldOf(clients, 'name'), 'es')).toBeTrue();
  });

  it('no frena por un campo opcional sin completar', () => {
    const item = { ...completeClient(), brandColor: '   ' };

    expect(blocksPublishing(item, fieldOf(clients, 'brandColor'), 'es')).toBeFalse();
  });

  it('frena por un campo opcional que está completo pero mal formado', () => {
    const item = { ...completeClient(), brandColor: 'rojo furioso' };

    expect(blocksPublishing(item, fieldOf(clients, 'brandColor'), 'es')).toBeTrue();
  });

  it('frena por un número fuera de rango', () => {
    const item = { ...completeClient(), since: 1800 };

    expect(blocksPublishing(item, fieldOf(clients, 'since'), 'es')).toBeTrue();
  });

  it('frena por un campo numérico que quedó sin número', () => {
    const item = { ...completeClient(), since: '' };

    expect(blocksPublishing(item, fieldOf(clients, 'since'), 'es')).toBeTrue();
  });

  // El panel edita un idioma por vez: el campo puede estar completo a la vista
  // y vacío en el otro, que es lo que el servidor rechazaba sin explicar.
  it('mira el campo traducible en el idioma que se le pide', () => {
    const item = completeClient();
    item.copy.en = { industry: 'Logistics', summary: '' };
    const summary = fieldOf(clients, 'summary');

    expect(blocksPublishing(item, summary, 'es')).toBeFalse();
    expect(blocksPublishing(item, summary, 'en')).toBeTrue();
  });

  it('frena por una lista sin un solo renglón escrito', () => {
    const item = services.blank();
    item.copy.es['deliverables'] = ['', '  '];

    expect(blocksPublishing(item, fieldOf(services, 'deliverables'), 'es')).toBeTrue();
  });

  it('no frena por una lista con al menos un renglón', () => {
    const item = services.blank();
    item.copy.es['deliverables'] = ['', 'Un entregable'];

    expect(blocksPublishing(item, fieldOf(services, 'deliverables'), 'es')).toBeFalse();
  });
});

describe('langBlocksPublishing', () => {
  it('avisa del idioma al que le falta un campo traducible', () => {
    const item = completeClient();
    item.copy.en = { industry: 'Logistics', summary: '' };

    expect(langBlocksPublishing(item, clients, 'es')).toBeFalse();
    expect(langBlocksPublishing(item, clients, 'en')).toBeTrue();
  });

  it('ignora los campos que no son de un idioma', () => {
    const item = { ...completeClient(), name: '' };

    expect(langBlocksPublishing(item, clients, 'es')).toBeFalse();
  });
});

describe('itemBlocksPublishing', () => {
  it('no encuentra nada que frene a un ítem completo', () => {
    expect(itemBlocksPublishing(completeClient(), clients)).toBeFalse();
  });

  it('frena por una fila recién agregada, que está vacía por definición', () => {
    expect(itemBlocksPublishing(clients.blank(), clients)).toBeTrue();
  });

  // La fila se publica entera: lo que falte en inglés frena igual mientras se
  // está editando el español.
  it('frena por lo que falta en el idioma que no está a la vista', () => {
    const item = completeClient();
    item.copy.en = { industry: 'Logistics', summary: '' };

    expect(itemBlocksPublishing(item, clients)).toBeTrue();
  });
});

describe('fieldIssue', () => {
  it('no tiene nada que decir de un campo que está bien', () => {
    expect(fieldIssue(completeClient(), fieldOf(clients, 'name'), 'es')).toBeNull();
  });

  it('pide completar el campo obligatorio vacío', () => {
    const item = { ...completeClient(), name: '' };

    expect(fieldIssue(item, fieldOf(clients, 'name'), 'es')).toBe('Completá este campo');
  });

  it('usa el mensaje propio del campo cuando la forma no cumple', () => {
    const item = services.blank();
    item['bits'] = '12345678';

    expect(fieldIssue(item, fieldOf(services, 'bits'), 'es')).toBe(
      'Sólo ceros y unos, entre cuatro y dieciséis',
    );
  });

  // El caso que motivó el mensaje: el sitio estaba escrito y el panel lo
  // pintaba de rojo sin decir que le faltaba el esquema.
  it('explica qué le falta a una URL sin esquema', () => {
    const item = { ...completeClient(), website: 'tomasssale.com' };

    expect(fieldIssue(item, fieldOf(clients, 'website'), 'es')).toBe(
      'Tiene que empezar con https://',
    );
  });

  it('dice entre qué valores tiene que estar un número fuera de rango', () => {
    const item = { ...completeClient(), since: 1800 };

    expect(fieldIssue(item, fieldOf(clients, 'since'), 'es')).toBe(
      'Tiene que estar entre 1980 y 2100',
    );
  });

  it('distingue un número vacío de un cero', () => {
    const item = { ...completeClient(), since: '' };

    expect(fieldIssue(item, fieldOf(clients, 'since'), 'es')).toBe(
      'Tiene que ser un número entero',
    );
  });
});

describe('normalize del sitio web', () => {
  const website = fieldOf(clients, 'website');

  it('le pone el https:// al dominio escrito a secas', () => {
    expect(website.normalize?.('tomasssale.com')).toBe('https://tomasssale.com');
  });

  it('respeta el esquema que ya estaba escrito', () => {
    expect(website.normalize?.('http://tomasssale.com')).toBe('http://tomasssale.com');
  });

  // Taparlo escondería el problema: que lo rechace el servidor y se vea por qué.
  it('no disfraza de https un esquema que el servidor va a rechazar', () => {
    expect(website.normalize?.('javascript:alert(1)')).toBe('javascript:alert(1)');
  });

  it('deja vacío lo que está vacío, porque el campo es opcional', () => {
    expect(website.normalize?.('   ')).toBe('');
  });
});

describe('el identificador', () => {
  // Ya no se edita desde el panel: es la llave interna, no contenido.
  it('no aparece como campo en ninguna sección', () => {
    const sections = ['services', 'metrics', 'clients', 'steps', 'faqs'] as const;

    for (const section of sections) {
      const keys = specFor(section).fields.map((field) => field.key);
      expect(keys).not.toContain('id');
    }
  });

  it('se lo pone solo cada fila nueva, cumpliendo el patrón del servidor', () => {
    expect(clients.blank().id).toMatch(/^[a-z0-9][a-z0-9-]{0,59}$/);
  });

  // Sin campo donde editarlo, un choque de ids sería un rechazo sin salida.
  it('no se repite ni creando muchas filas de corrido', () => {
    const ids = Array.from({ length: 200 }, () => clients.blank().id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
