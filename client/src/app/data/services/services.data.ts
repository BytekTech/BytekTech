import { Service } from '../../domain/models/service.model';

export const SERVICES: Service[] = [
  {
    id: 'web',
    bits: '01110111',
    copy: {
      es: {
        name: 'Aplicaciones y plataformas web',
        description:
          'Productos que soportan operación real: paneles de gestión, portales de cliente y plataformas transaccionales, con la performance y la seguridad resueltas desde el día uno.',
        deliverables: ['Acceso por perfiles', 'Disponible 24/7', 'Crece con tu operación'],
      },
      en: {
        name: 'Web applications and platforms',
        description:
          'Products that carry real operations: management panels, customer portals and transactional platforms, with performance and security handled from day one.',
        deliverables: ['Role-based access', 'Available 24/7', 'Grows with your operation'],
      },
    },
  },
  {
    id: 'product',
    bits: '01110000',
    copy: {
      es: {
        name: 'Producto digital a medida',
        description:
          'De la idea al MVP en producción. Definimos alcance con vos, diseñamos la experiencia y entregamos algo usable temprano, para validar con usuarios y no con suposiciones.',
        deliverables: ['Alcance y precio cerrados', 'Primera versión usable', 'Validado con usuarios reales'],
      },
      en: {
        name: 'Custom digital products',
        description:
          'From idea to a live MVP. We define scope with you, design the experience and ship something usable early, so you validate with users instead of assumptions.',
        deliverables: ['Fixed scope and price', 'A usable first release', 'Validated with real users'],
      },
    },
  },
  {
    id: 'systems',
    bits: '01110011',
    copy: {
      es: {
        name: 'Sistemas internos e integraciones',
        description:
          'Automatizamos lo que hoy vive en planillas y conectamos las herramientas que ya usás: ERP, facturación, CRM y servicios de terceros hablando entre sí.',
        deliverables: ['Menos trabajo manual', 'Conectado a lo que ya usás', 'Sin perder tu historial'],
      },
      en: {
        name: 'Internal systems and integrations',
        description:
          'We automate what lives in spreadsheets today and connect the tools you already use: ERP, invoicing, CRM and third-party services talking to each other.',
        deliverables: ['Less manual work', 'Connected to your tools', 'Your history comes along'],
      },
    },
  },
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
