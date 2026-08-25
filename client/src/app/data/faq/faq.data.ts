import { FaqEntry } from '../../domain/models/faq.model';

export const FAQS: FaqEntry[] = [
  {
    id: 'services',
    copy: {
      es: {
        question: '¿Qué servicios ofrecen?',
        answer:
          'Diseñamos y construimos software a medida: aplicaciones web, productos digitales, sistemas internos, integraciones y cloud. Cada proyecto arranca por el problema del negocio y no por la tecnología: primero entendemos cómo trabaja el equipo hoy y recién después elegimos el stack. También nos hacemos cargo del despliegue, del monitoreo y de la evolución de lo que construimos.',
      },
      en: {
        question: 'What services do you offer?',
        answer:
          'We design and build custom software: web applications, digital products, internal systems, integrations and cloud. Every project starts from the business problem rather than the technology: first we learn how the team works today, and only then do we choose the stack. We also take care of deployment, monitoring and the ongoing evolution of what we build.',
      },
    },
  },
  {
    id: 'start',
    copy: {
      es: {
        question: '¿Cómo empieza un proyecto?',
        answer:
          'Con una reunión inicial sin costo, en la que escuchamos el problema, el contexto y los plazos con los que contás. Después te mandamos una propuesta con alcance, tiempos y presupuesto cerrado por etapa, escrita en castellano y sin letra chica. Si el camino cierra, arrancamos por un MVP: la versión más chica que ya resuelve algo real y se puede poner en manos de usuarios.',
      },
      en: {
        question: 'How does a project start?',
        answer:
          'With a free initial meeting where we listen to the problem, the context and the deadlines you are working with. We then send you a proposal with scope, timeline and a fixed budget per stage, written in plain language and with no fine print. If it all makes sense, we start with an MVP: the smallest version that already solves something real and can be put in front of users.',
      },
    },
  },
  {
    id: 'cost',
    copy: {
      es: {
        question: '¿Cómo cotizan?',
        answer:
          'Con presupuesto cerrado por etapa, definido después de la primera reunión según el alcance que acordamos. Lo preferimos a la facturación por hora porque sabés desde el primer día cuánto cuesta cada entrega y no aparecen sorpresas a fin de mes. Si el alcance cambia en el camino, lo cotizamos aparte y te lo pasamos antes de escribir una línea de código.',
      },
      en: {
        question: 'How do you quote?',
        answer:
          'With a fixed budget per stage, defined after the first meeting based on the scope we agree on. We prefer this to hourly billing because you know from day one what each delivery costs, with no surprises at the end of the month. If the scope changes along the way, we quote it separately and share it before writing a single line of code.',
      },
    },
  },
  {
    id: 'timeline',
    copy: {
      es: {
        question: '¿Cuánto tarda un proyecto?',
        answer:
          'Depende del alcance: un MVP típico lleva entre 6 y 10 semanas desde que se aprueba la propuesta. Trabajamos en entregas cortas, con algo funcionando que puedas ver y probar cada semana, así el plazo se sigue sobre hechos y no sobre promesas. Los proyectos más grandes se parten en etapas, cada una con su propio plazo y su propio presupuesto.',
      },
      en: {
        question: 'How long does a project take?',
        answer:
          'It depends on the scope: a typical MVP takes 6 to 10 weeks from the moment the proposal is approved. We work in short cycles, with something running that you can see and try every week, so progress is tracked against facts rather than promises. Larger projects are split into stages, each with its own timeline and its own budget.',
      },
    },
  },
  {
    id: 'remote',
    copy: {
      es: {
        question: '¿Trabajan con clientes del exterior?',
        answer:
          'Sí, trabajamos 100% remoto, en español y en inglés, con clientes en distintos husos horarios. Acordamos una franja de horas en común para las reuniones y dejamos el resto del trabajo asincrónico y documentado por escrito. Así la diferencia horaria nunca frena una decisión ni te obliga a esperar un día entero por una respuesta.',
      },
      en: {
        question: 'Do you work with international clients?',
        answer:
          'Yes, we work 100% remotely, in English and Spanish, with clients across different time zones. We agree on a shared window of hours for meetings and keep the rest of the work asynchronous and documented in writing. That way the time difference never blocks a decision or leaves you waiting a full day for an answer.',
      },
    },
  },
  {
    id: 'support',
    copy: {
      es: {
        question: '¿Dan soporte después del lanzamiento?',
        answer:
          'Sí, ofrecemos planes de mantenimiento y evolución continua del producto: correcciones, monitoreo, actualización de dependencias y funcionalidades nuevas. Para nosotros el lanzamiento es el comienzo de la vida del sistema, no el final del proyecto. Y si en algún momento preferís seguir con tu propio equipo, entregamos el código, la documentación y el traspaso completo.',
      },
      en: {
        question: 'Do you provide support after launch?',
        answer:
          'Yes, we offer maintenance plans and continuous product evolution: fixes, monitoring, dependency updates and new features. For us the launch is where the system starts its life, not where the project ends. And if at some point you would rather continue with your own team, we hand over the code, the documentation and a full walkthrough.',
      },
    },
  },
];
