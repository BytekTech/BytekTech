import { SiteContent } from '../../domain/models/site-content.model';
import { CLIENTS } from '../clients/clients.data';
import { FAQS } from '../faq/faq.data';
import { METRICS } from '../metrics/metrics.data';
import { PROCESS_STEPS } from '../process/process.data';
import { SERVICES } from '../services/services.data';

/**
 * Contenido de arranque: lo que el sitio muestra mientras nadie haya guardado
 * nada desde el panel. Se copia en profundidad porque el llamador puede
 * editarlo, y estas constantes son las mismas que compila el bundle.
 */
export function seedContent(): SiteContent {
  return structuredClone({
    services: SERVICES,
    metrics: METRICS,
    clients: CLIENTS,
    steps: PROCESS_STEPS,
    faqs: FAQS,
  });
}
