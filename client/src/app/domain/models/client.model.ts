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
   * Logotipo del cliente, embebido como data URI. Va adentro del contenido y
   * no en un archivo aparte porque no hay almacenamiento de archivos detrás;
   * `client-icon.ts` guarda los límites que hacen que eso sea sostenible.
   *
   * Se dibuja siempre con `<img>`, nunca incrustándolo en el documento: dentro
   * de un `<img>` el navegador no ejecuta lo que pueda traer un SVG.
   */
  icon?: string;
  /**
   * Color oficial de la marca, en el formato que entienda CSS. La cinta muestra
   * las marcas apagadas y sólo enciende este color bajo el puntero; sin color
   * declarado, la marca se enciende con el acento de la casa.
   */
  brandColor?: string;
}
