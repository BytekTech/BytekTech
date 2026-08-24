import { FaqEntry } from '../../domain/models/faq.model';

export const FAQS: FaqEntry[] = [
  {
    id: 'services',
    copy: {
      es: {
        question: '¿Qué servicios ofrecen?',
        answer:
          'Diseñamos y construimos software a medida: aplicaciones web, productos digitales, sistemas internos, integraciones y cloud.',
      },
      en: {
        question: 'What services do you offer?',
        answer:
          'We design and build custom software: web applications, digital products, internal systems, integrations and cloud.',
      },
    },
  },
  {
    id: 'start',
    copy: {
      es: {
        question: '¿Cómo empieza un proyecto?',
        answer:
          'Con una reunión inicial sin costo. Después te mandamos una propuesta con alcance, tiempos y presupuesto, y arrancamos por un MVP.',
      },
      en: {
        question: 'How does a project start?',
        answer:
          'With a free initial meeting. Then we send you a proposal with scope, timeline and budget, and we start with an MVP.',
      },
    },
  },
  {
    id: 'cost',
    copy: {
      es: {
        question: '¿Cómo cotizan?',
        answer:
          'Con presupuesto cerrado por etapa, definido después de la primera reunión según el alcance.',
      },
      en: {
        question: 'How do you quote?',
        answer:
          'With a fixed budget per stage, defined after the first meeting based on the scope.',
      },
    },
  },
  {
    id: 'timeline',
    copy: {
      es: {
        question: '¿Cuánto tarda un proyecto?',
        answer: 'Depende del alcance: un MVP típico lleva entre 6 y 10 semanas.',
      },
      en: {
        question: 'How long does a project take?',
        answer: 'It depends on the scope: a typical MVP takes 6 to 10 weeks.',
      },
    },
  },
  {
    id: 'remote',
    copy: {
      es: {
        question: '¿Trabajan con clientes del exterior?',
        answer: 'Sí, trabajamos 100% remoto, en español y en inglés.',
      },
      en: {
        question: 'Do you work with international clients?',
        answer: 'Yes, we work 100% remotely, in English and Spanish.',
      },
    },
  },
  {
    id: 'support',
    copy: {
      es: {
        question: '¿Dan soporte después del lanzamiento?',
        answer: 'Sí, ofrecemos planes de mantenimiento y evolución continua del producto.',
      },
      en: {
        question: 'Do you provide support after launch?',
        answer: 'Yes, we offer maintenance plans and continuous product evolution.',
      },
    },
  },
];
