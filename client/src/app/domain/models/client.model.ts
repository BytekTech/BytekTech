import { Lang } from './language.model';

export interface ClientCopy {
  /** Rubro del cliente: ubica a quien lee sin necesidad de conocer la empresa. */
  industry: string;
  /** Qué se construyó o se sostiene para ese cliente, en una línea. */
  summary: string;
}

export interface Client {
  id: string;
  name: string;
  /** Año en que empezó la relación: la antigüedad es parte de la prueba. */
  since: number;
  copy: Record<Lang, ClientCopy>;
  website?: string;
  /**
   * Color oficial de la marca, en el formato que entienda CSS. La cinta muestra
   * las marcas apagadas y sólo enciende este color bajo el puntero; sin color
   * declarado, la marca se enciende con el acento de la casa.
   */
  brandColor?: string;
}
