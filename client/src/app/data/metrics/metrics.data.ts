import { Metric } from '../../domain/models/metric.model';

// ─────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Cifras provisorias. Son afirmaciones públicas sobre la empresa:
// reemplazar por números reales y verificables antes de publicar el sitio.
//
// Las dos últimas ('on-time' y 'retention') son una propuesta: hablan de lo que
// le pasa al cliente —recibe en fecha y se queda— en vez de describirnos a
// nosotros. Confirmar los valores o cambiar la métrica antes de publicar.
// ─────────────────────────────────────────────────────────────────────────────
export const METRICS: Metric[] = [
  {
    id: 'projects',
    value: 12,
    prefix: '+',
    copy: {
      es: { label: 'Proyectos entregados', detail: 'en producción, no en demo' },
      en: { label: 'Projects delivered', detail: 'in production, not in demo' },
    },
  },
  {
    id: 'years',
    value: 3,
    prefix: '+',
    copy: {
      es: { label: 'Años construyendo software', detail: 'para empresas de distintos rubros' },
      en: { label: 'Years building software', detail: 'for companies across industries' },
    },
  },
  {
    id: 'on-time',
    value: 95,
    suffix: ' %',
    copy: {
      es: {
        label: 'Entregas en la fecha acordada',
        detail: 'con el alcance y el precio cerrados de entrada',
      },
      en: {
        label: 'Deliveries on the agreed date',
        detail: 'with scope and price fixed up front',
      },
    },
  },
  {
    id: 'retention',
    value: 9,
    suffix: '/10',
    copy: {
      es: {
        label: 'Clientes que siguen con nosotros',
        detail: 'después del primer proyecto entregado',
      },
      en: {
        label: 'Clients that stay with us',
        detail: 'after the first project ships',
      },
    },
  },
];
