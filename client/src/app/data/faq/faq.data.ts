import { FaqEntry } from '../../domain/models/faq.model';

export const FAQS: FaqEntry[] = [
  {
    id: 'services',
    copy: {
      es: {
        question: '¿Qué servicios ofrecen?',
        answer:
          'Diseñamos y construimos software a medida: aplicaciones web, productos digitales, sistemas internos, integraciones y cloud. Cada proyecto arranca por el problema del negocio, no por la tecnología.',
      },
      en: {
        question: 'What services do you offer?',
        answer:
          'We design and build custom software: web applications, digital products, internal systems, integrations and cloud. Every project starts from the business problem, not the technology.',
      },
    },
  },
  {
    id: 'start',
    copy: {
      es: {
        question: '¿Cómo empieza un proyecto?',
        answer:
          'Con una reunión inicial sin costo. Después te mandamos una propuesta con alcance, tiempos y presupuesto cerrado, y arrancamos por un MVP.',
      },
      en: {
        question: 'How does a project start?',
        answer:
          'With a free initial meeting. Then we send you a proposal with scope, timeline and a fixed budget, and we start with an MVP.',
      },
    },
  },
  {
    id: 'cost',
    copy: {
      es: {
        question: '¿Cómo cotizan?',
        answer:
          'Con presupuesto cerrado por etapa, definido después de la primera reunión según el alcance. Sabés desde el primer día cuánto cuesta cada entrega.',
      },
      en: {
        question: 'How do you quote?',
        answer:
          'With a fixed budget per stage, defined after the first meeting based on the scope. You know from day one what each delivery costs.',
      },
    },
  },
  {
    id: 'timeline',
    copy: {
      es: {
        question: '¿Cuánto tarda un proyecto?',
        answer:
          'Depende del alcance: un MVP típico lleva entre 6 y 10 semanas. Trabajamos en entregas cortas, con algo funcionando que puedas probar cada semana.',
      },
      en: {
        question: 'How long does a project take?',
        answer:
          'It depends on the scope: a typical MVP takes 6 to 10 weeks. We work in short cycles, with something running that you can try every week.',
      },
    },
  },
  {
    id: 'remote',
    copy: {
      es: {
        question: '¿Trabajan con clientes del exterior?',
        answer:
          'Sí, trabajamos 100% remoto, en español y en inglés. Acordamos una franja de horas en común y el resto del trabajo queda documentado por escrito.',
      },
      en: {
        question: 'Do you work with international clients?',
        answer:
          'Yes, we work 100% remotely, in English and Spanish. We agree on a shared window of hours and keep the rest of the work documented in writing.',
      },
    },
  },
  {
    id: 'support',
    copy: {
      es: {
        question: '¿Dan soporte después del lanzamiento?',
        answer:
          'Sí, con planes de mantenimiento y evolución continua: correcciones, monitoreo, actualizaciones y funcionalidades nuevas. El lanzamiento es el comienzo, no el final.',
      },
      en: {
        question: 'Do you provide support after launch?',
        answer:
          'Yes, with maintenance plans and continuous evolution: fixes, monitoring, updates and new features. The launch is the beginning, not the end.',
      },
    },
  },
];
