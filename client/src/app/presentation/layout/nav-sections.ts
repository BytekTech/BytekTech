/** Etiquetas de navegación disponibles en las traducciones. */
export type NavLabel = 'services' | 'clients' | 'process' | 'faq' | 'contact';

export interface NavSection {
  /** Ancla de la sección dentro del one-page. */
  fragment: string;
  label: NavLabel;
}

/** Secciones enlazadas desde la navegación, en el orden en que aparecen. */
export const NAV_SECTIONS: readonly NavSection[] = [
  { fragment: 'servicios', label: 'services' },
  { fragment: 'clientes', label: 'clients' },
  { fragment: 'proceso', label: 'process' },
  { fragment: 'preguntas', label: 'faq' },
  { fragment: 'contacto', label: 'contact' },
];
