import { Service } from '../../domain/models/service.model';

// ─────────────────────────────────────────────────────────────────────────────
// Servicios retirados de la grilla pública, guardados tal cual para poder
// volver a ofrecerlos sin reescribirlos. Nada de este archivo se importa desde
// la app: para reactivar uno, moverlo de vuelta a services.data.ts.
// ─────────────────────────────────────────────────────────────────────────────
export const ARCHIVED_SERVICES: Service[] = [
  {
    id: 'cloud',
    bits: '01100011',
    copy: {
      es: {
        name: 'Cloud, datos e infraestructura',
        description:
          'Infraestructura que escala sin sorpresas en la factura, con métricas a la vista: monitoreo, alertas y tableros para decidir con datos y no con intuición.',
        deliverables: ['Costos previsibles', 'Nos enteramos antes que el cliente', 'Tableros para decidir'],
      },
      en: {
        name: 'Cloud, data and infrastructure',
        description:
          'Infrastructure that scales without billing surprises, with metrics in plain sight: monitoring, alerts and dashboards so you decide on data, not intuition.',
        deliverables: ['Predictable costs', 'We find out before your client', 'Dashboards to decide with'],
      },
    },
  },
];
