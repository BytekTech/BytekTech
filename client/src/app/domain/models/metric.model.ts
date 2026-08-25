import { Lang } from './language.model';

export interface MetricCopy {
  label: string;
  detail: string;
}

/** Cifra verificable de la operación, mostrada como prueba concreta. */
export interface Metric {
  id: string;
  value: number;
  /** Signo que antecede al número: '+', '~'. */
  prefix?: string;
  /** Unidad o matiz que sigue al número: '%', '/10', ' h'. */
  suffix?: string;
  copy: Record<Lang, MetricCopy>;
}
