import { COMPANY } from '../../data/company/company.data';
import { seedContent } from '../../data/content/seed-content';
import {
  buildStructuredData,
  IndexedPage,
  serializeForScript,
  StructuredDataInput,
} from './structured-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = Record<string, any>;

const HOME: IndexedPage = {
  url: `${COMPANY.siteUrl}/`,
  title: 'Inicio',
  description: 'Qué hacemos',
  isHome: true,
};

function build(overrides: Partial<StructuredDataInput> = {}): Node[] {
  const data = buildStructuredData({
    company: COMPANY,
    lang: 'es',
    summary: 'Software a medida',
    page: HOME,
    content: seedContent(),
    ...overrides,
  });
  return data['@graph'] as Node[];
}

function nodeOf(graph: Node[], type: string): Node | undefined {
  return graph.find((node) => [node['@type']].flat().includes(type));
}

describe('buildStructuredData', () => {
  it('describe la organización con el año de fundación y el resumen', () => {
    const organization = nodeOf(build(), 'Organization') as Node;

    expect(organization['foundingDate']).toBe('2023');
    expect(organization['description']).toBe('Software a medida');
  });

  it('publica cada servicio como una oferta de la organización, en el idioma servido', () => {
    const content = seedContent();
    const organization = nodeOf(build({ lang: 'en', content }), 'Organization') as Node;
    const names = content.services.map((service) => service.copy.en.name);
    const offered = organization['hasOfferCatalog'].itemListElement.map(
      (offer: Node) => offer['itemOffered'],
    );

    expect(offered.map((service: Node) => service['name'])).toEqual(names);
    expect(offered[0].provider['@id']).toBe(organization['@id']);
    expect(organization['knowsAbout']).toEqual(names);
  });

  it('en el home ata cada respuesta frecuente a su pregunta', () => {
    const content = seedContent();
    const page = nodeOf(build({ content }), 'FAQPage') as Node;

    expect(page['@type']).toEqual(['WebPage', 'FAQPage']);
    expect(page['mainEntity'].length).toBe(content.faqs.length);
    expect(page['mainEntity'][0]).toEqual({
      '@type': 'Question',
      name: content.faqs[0].copy.es.question,
      acceptedAnswer: { '@type': 'Answer', text: content.faqs[0].copy.es.answer },
    });
  });

  it('fuera del home la página no se presenta como preguntas frecuentes', () => {
    const terms: IndexedPage = { ...HOME, url: `${COMPANY.siteUrl}/terms`, isHome: false };
    const graph = build({ page: terms });

    expect(nodeOf(graph, 'FAQPage')).toBeUndefined();
    expect(nodeOf(graph, 'WebPage')?.['url']).toBe(`${COMPANY.siteUrl}/terms`);
  });

  it('una página que no se indexa no se describe', () => {
    const graph = build({ page: null });

    expect(nodeOf(graph, 'WebPage')).toBeUndefined();
    expect(nodeOf(graph, 'Organization')).toBeDefined();
  });

  it('sin contenido todavía, describe la organización sin catálogo', () => {
    const organization = nodeOf(build({ content: null }), 'Organization') as Node;

    expect(organization['hasOfferCatalog']).toBeUndefined();
    expect(organization['knowsAbout']).toBeUndefined();
  });
});

describe('serializeForScript', () => {
  it('no deja que un texto cierre la etiqueta del script', () => {
    const json = serializeForScript({ text: 'Fin</script><script>alert(1)</script>' });

    expect(json).not.toContain('<');
    expect(JSON.parse(json).text).toBe('Fin</script><script>alert(1)</script>');
  });
});
