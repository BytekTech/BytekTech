import { ChangeDetectionStrategy, Component, inject, RESPONSE_INIT } from '@angular/core';
import { LanguageService } from '../../../application/language.service';
import { pathFor } from '../../../application/i18n/site-pages';

/** El 404 escrito en binario: la firma de la casa aplicada al error. */
const NOT_FOUND_BITS = (404).toString(2);

/**
 * Respuesta a cualquier dirección que no existe. Antes esas direcciones
 * redirigían al home, y un buscador lo lee como un 404 disfrazado: indexa
 * basura con el contenido del home. Ahora la respuesta lleva su código real.
 */
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly language = inject(LanguageService);

  readonly t = this.language.t;
  readonly bits = NOT_FOUND_BITS;
  readonly homePath = pathFor('home');
  /**
   * Siempre con la raíz adelante: la sección de contacto vive en el home, no
   * acá. No sale de `language.anchor()` porque al crearse el componente la
   * navegación todavía no terminó y la página activa sigue siendo la anterior.
   */
  readonly contactHref = `${this.homePath}#contacto`;

  constructor() {
    // Sólo existe al renderizar en el servidor: es la respuesta HTTP que se
    // está armando. En el navegador la página ya llegó con su código.
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) {
      response.status = 404;
    }
  }
}
