import { Lang } from './language.model';

export interface ProcessStepCopy {
  name: string;
  description: string;
  /** Duración típica de la etapa, tal como se le comunica al cliente. */
  duration: string;
}

export interface ProcessStep {
  id: string;
  order: number;
  copy: Record<Lang, ProcessStepCopy>;
}
