import { Client } from '../../domain/models/client.model';

// ─────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Clientes provisorios. Nombrar a una empresa afirma públicamente
// una relación comercial: reemplazar por los clientes reales —y con permiso de
// cada uno para aparecer— antes de publicar el sitio.
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENTS: Client[] = [
  {
    id: 'nodo',
    name: 'Nodo Logística',
    since: 2023,
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
  {
    id: 'vetta',
    name: 'Vetta',
    since: 2024,
    copy: {
      es: {
        industry: 'Comercio mayorista',
        summary: 'Catálogo B2B con precios por cliente y facturación integrada al ERP.',
      },
      en: {
        industry: 'Wholesale',
        summary: 'A B2B catalog with per-customer pricing and ERP-integrated invoicing.',
      },
    },
  },
  {
    id: 'pulso',
    name: 'Grupo Pulso',
    since: 2024,
    copy: {
      es: {
        industry: 'Industria y manufactura',
        summary: 'Métricas de planta al segundo, con alertas configurables por sector.',
      },
      en: {
        industry: 'Industry and manufacturing',
        summary: 'Plant metrics by the second, with configurable alerts per area.',
      },
    },
  },
  {
    id: 'turnia',
    name: 'Turnia Salud',
    since: 2022,
    copy: {
      es: {
        industry: 'Salud',
        summary: 'Reserva online y agenda unificada para 12 consultorios.',
      },
      en: {
        industry: 'Healthcare',
        summary: 'Online booking and a unified schedule across 12 practices.',
      },
    },
  },
];
