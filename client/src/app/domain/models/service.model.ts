import { Lang } from './language.model';

export interface ServiceCopy {
  name: string;
  description: string;
  /** Entregables concretos, para que el servicio no quede en abstracto. */
  deliverables: string[];
}

export interface Service {
  id: string;
  /** Byte que identifica al servicio en el motivo binario de la marca. */
  bits: string;
  copy: Record<Lang, ServiceCopy>;
}
