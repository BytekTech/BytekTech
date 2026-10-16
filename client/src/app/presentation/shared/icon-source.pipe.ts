import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { iconIssue } from '../../domain/models/client-icon';

/**
 * Convierte el icono de un cliente en algo que `[src]` acepte.
 *
 * Angular no deja pasar un data URI de SVG: su lista de data-URLs seguras tiene
 * los mapas de bits y deja afuera al vector, porque un SVG puede traer código.
 * Acá se levanta esa veda, y conviene que quede escrito por qué se puede:
 *
 * 1. El valor ya pasó por `iconIssue`, que acepta tres formatos y nada más, y
 *    que a los SVG les revisa scripts, manejadores de evento, HTML incrustado
 *    y referencias a otro servidor. Lo aplica el servidor al publicar, que es
 *    donde manda, y se vuelve a aplicar acá sobre lo que llegue.
 * 2. Se dibuja con `<img>`. Dentro de un `<img>` el navegador trata al SVG en
 *    modo estático: no ejecuta scripts ni sale a buscar nada afuera. Incrustar
 *    el mismo SVG en el documento sí sería peligroso, y por eso no se hace en
 *    ningún lado.
 *
 * Si alguna vez hace falta mostrar el icono fuera de un `<img>`, esto deja de
 * alcanzar: hay que sanear el SVG de verdad o renunciar al vector.
 */
@Pipe({ name: 'iconSource' })
export class IconSourcePipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(icon: string | undefined | null): SafeUrl | null {
    if (!icon || iconIssue(icon) !== null) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustUrl(icon);
  }
}
