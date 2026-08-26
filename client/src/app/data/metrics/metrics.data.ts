import { Metric } from '../../domain/models/metric.model';

// ─────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Cifras provisorias. Son afirmaciones públicas sobre la empresa:
// reemplazar por números reales y verificables antes de publicar el sitio.
//
// Las cuatro últimas ('on-time', 'budget', 'retention', 'incident') hablan de
// lo que le pasa al cliente —recibe en fecha, al precio pactado, se queda y lo
// atienden cuando algo se rompe— en vez de describirnos a nosotros. Confirmar
// cada valor o cambiar la métrica antes de publicar.
//
// Van de a tres por fila: seis entran en dos filas parejas, y la grilla las
// reparte de nuevo en pantallas chicas.
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
    id: 'budget',
    value: 0,
    suffix: ' %',
    copy: {
      es: {
        label: 'Desvío sobre el presupuesto',
        detail: 'lo que se firma de entrada es lo que se paga al final',
      },
      en: {
        label: 'Deviation from the quoted budget',
        detail: 'what is signed up front is what gets paid at the end',
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
  {
    id: 'incident',
    value: 2,
    prefix: '< ',
    suffix: ' h',
    copy: {
      es: {
        label: 'Respuesta ante un incidente crítico',
        detail: 'en horario hábil, sobre los sistemas que mantenemos',
      },
      en: {
        label: 'Response to a critical incident',
        detail: 'during business hours, on the systems we maintain',
      },
    },
  },
];
