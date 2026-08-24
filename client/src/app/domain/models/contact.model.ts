export interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  message: string;
  /**
   * Campo trampa: el formulario lo mantiene oculto para las personas, así que
   * sólo llega con contenido cuando lo completa un bot que rellena todo el
   * formulario. El servidor descarta esas peticiones.
   */
  website?: string;
}
