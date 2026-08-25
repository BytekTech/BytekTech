import { Client } from '../../domain/models/client.model';

// ────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Un único cliente de ejemplo, para ver la cinta funcionando.
// Nombrar a una empresa afirma públicamente una relación comercial: reemplazar
// por los clientes reales —y con permiso de cada uno para aparecer— antes de
// publicar el sitio. El `brandColor` va con el color de marca real del cliente,
// tal como figure en su manual de identidad.
// ────────────────────────────────────────────────────────────────────────────
export const CLIENTS: Client[] = [
  {
    id: 'nodo',
    name: 'Nodo Logística',
    since: 2023,
    brandColor: '#e8590c',
    copy: {
      es: {
        industry: 'Logística y transporte',
        summary:
          'Panel único de flota, órdenes y depósitos para una operación de más de 40 vehículos.',
      },
      en: {
        industry: 'Logistics and transport',
        summary: 'A single panel for fleet, orders and warehouses across 40+ vehicles.',
      },
    },
  },
];
