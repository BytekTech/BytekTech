import { ProcessStep } from '../../domain/models/process-step.model';

// Las duraciones y condiciones replican lo que ya se le promete al visitante
// en el asistente de preguntas frecuentes (faq.data.ts). Si cambian allá,
// tienen que cambiar acá.
export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'meeting',
    order: 1,
    copy: {
      es: {
        name: 'Reunión inicial',
        description:
          'Nos contás qué necesitás y qué restricciones tenés. Salimos con el problema entendido y una idea clara de por dónde arrancar.',
        duration: 'sin costo',
      },
      en: {
        name: 'First meeting',
        description:
          'You tell us what you need and what constraints you have. We leave with the problem understood and a clear idea of where to start.',
        duration: 'free of charge',
      },
    },
  },
  {
    id: 'proposal',
    order: 2,
    copy: {
      es: {
        name: 'Propuesta',
        description:
          'Te mandamos alcance, tiempos y presupuesto cerrado por etapa. Sin horas abiertas ni sorpresas a mitad de camino.',
        duration: 'presupuesto cerrado',
      },
      en: {
        name: 'Proposal',
        description:
          'We send you scope, timeline and a fixed budget per stage. No open-ended hours, no surprises halfway through.',
        duration: 'fixed budget',
      },
    },
  },
  {
    id: 'mvp',
    order: 3,
    copy: {
      es: {
        name: 'MVP en producción',
        description:
          'Construimos la versión más chica que resuelve el problema y la ponemos a andar, con entregas parciales que podés ver y probar.',
        duration: '6 a 10 semanas',
      },
      en: {
        name: 'MVP in production',
        description:
          'We build the smallest version that solves the problem and put it live, with partial releases you can see and try.',
        duration: '6 to 10 weeks',
      },
    },
  },
  {
    id: 'evolution',
    order: 4,
    copy: {
      es: {
        name: 'Evolución y soporte',
        description:
          'El producto sigue creciendo con datos de uso real. Mantenimiento, mejoras y nuevas funciones sobre una base que ya conocemos.',
        duration: 'plan continuo',
      },
      en: {
        name: 'Evolution and support',
        description:
          'The product keeps growing on real usage data. Maintenance, improvements and new features on a codebase we already know.',
        duration: 'ongoing plan',
      },
    },
  },
];
