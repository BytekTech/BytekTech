import { Metric } from '../../domain/models/metric.model';

// ─────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Cifras provisorias. Son afirmaciones públicas sobre la empresa:
// reemplazar por números reales y verificables antes de publicar el sitio.
// El único dato que ya está confirmado es la duración del MVP (ver faq.data.ts).
// ─────────────────────────────────────────────────────────────────────────────
export const METRICS: Metric[] = [
  {
    id: 'projects',
    value: 20,
    suffix: '+',
    copy: {
      es: { label: 'Proyectos entregados', detail: 'en producción, no en demo' },
      en: { label: 'Projects delivered', detail: 'in production, not in demo' },
    },
  },
  {
    id: 'years',
    value: 6,
    copy: {
      es: { label: 'Años construyendo software', detail: 'para empresas de distintos rubros' },
      en: { label: 'Years building software', detail: 'for companies across industries' },
    },
  },
  {
    id: 'mvp',
    value: 8,
    suffix: ' sem',
    copy: {
      es: { label: 'Promedio hasta el MVP', detail: 'de la primera reunión a producción' },
      en: { label: 'Average time to MVP', detail: 'from the first meeting to production' },
    },
  },
  {
    id: 'response',
    value: 48,
    suffix: ' h',
    copy: {
      es: { label: 'Respuesta a tu consulta', detail: 'hábiles, con próximos pasos concretos' },
      en: { label: 'Reply to your enquiry', detail: 'business hours, with concrete next steps' },
    },
  },
];
