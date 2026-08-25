import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Todo se renderiza por pedido. Ya no hay una copia congelada por idioma: el
 * idioma sale de la cabecera del visitante y el contenido lo edita el panel,
 * y ninguna de las dos cosas se puede decidir en tiempo de compilación.
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Server }];
