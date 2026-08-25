import { SiteContent } from '../../app/domain/models/site-content.model';

/**
 * Puerto de persistencia del contenido. El resto del servidor no sabe si
 * detrás hay un archivo, una base de datos o un servicio: cambiar de motor es
 * escribir otra implementación de esta interfaz y nada más.
 */
export interface ContentStore {
  read(): Promise<SiteContent>;
  write(content: SiteContent): Promise<void>;
}
