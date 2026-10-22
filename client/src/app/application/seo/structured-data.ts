import { Company } from '../../domain/models/company.model';
import { Lang, SUPPORTED_LANGS } from '../../domain/models/language.model';
import { SiteContent } from '../../domain/models/site-content.model';

/**
 * Datos estructurados (schema.org) del sitio.
 *
 * Son lo que leen sin adivinar tanto los buscadores como los asistentes de IA
 * que responden con lo que encuentran en la web: quién es la empresa, qué
 * servicios da y qué contesta a las preguntas de siempre. Se arman con el
 * contenido publicado, el mismo que se ve en pantalla —declarar algo que la
 * página no muestra es lo que los buscadores penalizan—.
 */

/** La página indexable que se está sirviendo. */
export interface IndexedPage {
  url: string;
  title: string;
  description: string;
  isHome: boolean;
}

export interface StructuredDataInput {
  company: Company;
  lang: Lang;
  /** Qué hace la empresa, en una línea: la descripción del home. */
  summary: string;
  /** `null` cuando la página no se indexa: entonces no se la describe. */
  page: IndexedPage | null;
  /** `null` mientras no llegó: la organización se describe igual, sin catálogo. */
  content: SiteContent | null;
}

type Node = Record<string, unknown>;

export function buildStructuredData(input: StructuredDataInput): Node {
  const ids = idsFor(input.company.siteUrl);
  const graph: Node[] = [organization(input, ids), website(input.company, ids)];
  if (input.page) {
    graph.push(webPage(input, input.page, ids));
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

interface Ids {
  organization: string;
  website: string;
}

function idsFor(siteUrl: string): Ids {
  return { organization: `${siteUrl}#organization`, website: `${siteUrl}#website` };
}

function organization({ company, lang, summary, content }: StructuredDataInput, ids: Ids): Node {
  const services = content?.services ?? [];
  const node: Node = {
    '@type': 'Organization',
    '@id': ids.organization,
    name: company.name,
    legalName: company.legalName,
    description: summary,
    url: company.siteUrl,
    email: company.email,
    telephone: company.phone,
    logo: `${company.siteUrl}/apple-touch-icon.png`,
    foundingDate: String(company.foundedYear),
    sameAs: company.social.map((link) => link.url),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: company.email,
      telephone: company.phone,
      availableLanguage: SUPPORTED_LANGS,
    },
  };

  if (services.length > 0) {
    node['knowsAbout'] = services.map((service) => service.copy[lang].name);
    node['hasOfferCatalog'] = {
      '@type': 'OfferCatalog',
      name: company.name,
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.copy[lang].name,
          description: service.copy[lang].description,
          provider: { '@id': ids.organization },
        },
      })),
    };
  }
  return node;
}

/** El sitio apunta siempre a la raíz, sea cual sea la página que se sirve. */
function website(company: Company, ids: Ids): Node {
  return {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${company.siteUrl}/`,
    name: company.name,
    publisher: { '@id': ids.organization },
    inLanguage: SUPPORTED_LANGS,
  };
}

/**
 * La página servida. En el home, que es donde están las preguntas frecuentes,
 * además es una página de preguntas: así cada respuesta queda atada a su
 * pregunta en vez de ser un párrafo suelto que hay que interpretar.
 */
function webPage({ lang, content }: StructuredDataInput, page: IndexedPage, ids: Ids): Node {
  const faqs = page.isHome ? (content?.faqs ?? []) : [];
  const node: Node = {
    '@type': faqs.length > 0 ? ['WebPage', 'FAQPage'] : 'WebPage',
    '@id': `${page.url}#webpage`,
    url: page.url,
    name: page.title,
    description: page.description,
    inLanguage: lang,
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.organization },
  };

  if (faqs.length > 0) {
    node['mainEntity'] = faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.copy[lang].question,
      acceptedAnswer: { '@type': 'Answer', text: faq.copy[lang].answer },
    }));
  }
  return node;
}

/**
 * JSON listo para ir dentro de un `<script>`. Lleva texto escrito en el panel,
 * y el HTML del servidor no escapa el interior de un script: una respuesta con
 * `</script>` cerraría la etiqueta y lo que siguiera se leería como HTML. Con
 * el `<` escapado el JSON significa lo mismo y no puede cerrar nada.
 */
export function serializeForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
