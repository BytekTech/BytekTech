import { Lang } from './language.model';

export interface LegalClauseCopy {
  heading: string;
  /** Cada elemento es un párrafo; el orden es el del documento. */
  paragraphs: string[];
}

/** Cláusula de un documento legal, numerada por su posición en el documento. */
export interface LegalClause {
  id: string;
  copy: Record<Lang, LegalClauseCopy>;
}

export interface LegalDocument {
  /** Fecha de la última revisión, en formato ISO (AAAA-MM-DD). */
  updatedAt: string;
  clauses: LegalClause[];
}
