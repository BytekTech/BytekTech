import { Lang } from './language.model';

export interface MetricCopy {
  label: string;
  detail: string;
}

/** Cifra verificable de la operación, mostrada como prueba concreta. */
export interface Metric {
  id: string;
  value: number;
  /** Sufijo o prefijo del número: '+', '%', 'sem'. */
  suffix?: string;
  copy: Record<Lang, MetricCopy>;
}
