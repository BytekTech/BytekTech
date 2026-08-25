import { Client } from './client.model';
import { FaqEntry } from './faq.model';
import { Metric } from './metric.model';
import { ProcessStep } from './process-step.model';
import { Service } from './service.model';

/**
 * Todo el contenido editable del sitio en una sola pieza. Las secciones se
 * publican juntas porque juntas cuentan una misma historia: si el panel guarda
 * una y falla en otra, el visitante ve dos versiones distintas de la casa.
 */
export interface SiteContent {
  services: Service[];
  metrics: Metric[];
  clients: Client[];
  steps: ProcessStep[];
  faqs: FaqEntry[];
}

/** Nombre de cada colección editable: el panel guarda de a una por vez. */
export type ContentSection = keyof SiteContent;

export const CONTENT_SECTIONS: readonly ContentSection[] = [
  'services',
  'metrics',
  'clients',
  'steps',
  'faqs',
];

export function isContentSection(value: unknown): value is ContentSection {
  return typeof value === 'string' && CONTENT_SECTIONS.includes(value as ContentSection);
}
