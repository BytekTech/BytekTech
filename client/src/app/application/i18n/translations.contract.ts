import { Lang } from '../../domain/models/language.model';

// Contrato de i18n de la UI. Vive en la capa de aplicación (no en domain)
// porque describe textos de presentación, no reglas de negocio. El único
// concepto de dominio es Lang, que sí reside en domain/models.
//
// Sólo cubre el "chrome" del sitio: navegación, encabezados de sección,
// formulario y footer. El contenido de cada sección (servicios, proceso,
// clientes, métricas, FAQ) lleva su propio copy por idioma en la capa de
// datos, para que ningún idioma pueda quedar con menos entradas que otro.
export interface Translations {
  meta: {
    title: string;
    description: string;
  };
  skipToContent: string;
  nav: {
    services: string;
    clients: string;
    process: string;
    faq: string;
    contact: string;
    langLabel: string;
    menuOpen: string;
    menuClose: string;
  };
  theme: {
    /** Etiqueta de la acción, no del estado: describe a qué tema se pasa. */
    toLight: string;
    toDark: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    /** Remates que rotan al final del título. El primero es el que se prerenderiza. */
    titleAccents: string[];
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  services: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Frentes de trabajo, en una línea: acompañan al eyebrow del lado derecho. */
    disciplines: readonly string[];
    deliverablesLabel: string;
  };
  metrics: {
    eyebrow: string;
    title: string;
  };
  clients: {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Etiqueta accesible de la cinta de clientes: sin ella es una lista sin nombre. */
    carouselLabel: string;
  };
  process: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    stillAsking: string;
    cta: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
    directLabel: string;
    form: {
      name: string;
      email: string;
      company: string;
      message: string;
      submit: string;
      sending: string;
      success: string;
      error: string;
      requiredError: string;
      emailError: string;
    };
  };
  chatbot: {
    open: string;
    close: string;
    title: string;
    greeting: string;
    prompt: string;
  };
  terms: {
    /** Metadata propia de la página: no comparte título con el one-page. */
    meta: {
      title: string;
      description: string;
    };
    eyebrow: string;
    title: string;
    intro: string;
    updatedLabel: string;
    back: string;
  };
  footer: {
    tagline: string;
    navLabel: string;
    contactLabel: string;
    followLabel: string;
    terms: string;
    rights: string;
  };
}

export type TranslationsDictionary = Record<Lang, Translations>;
