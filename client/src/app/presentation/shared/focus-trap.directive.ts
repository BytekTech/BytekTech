import { Directive, DOCUMENT, ElementRef, inject } from '@angular/core';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]),' +
  ' select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mantiene el foco del teclado dentro del elemento mientras está en pantalla.
 * Pensada para diálogos: sin esto, tabular desde un panel abierto lleva el foco
 * al contenido de fondo, que el lector de pantalla no debería alcanzar todavía.
 */
@Directive({
  selector: '[appFocusTrap]',
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class FocusTrapDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((element) => element.offsetParent !== null);

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    // El propio contenedor es focusable (tabindex="-1") y cuenta como "antes del primero".
    if (event.shiftKey && (active === first || active === this.host.nativeElement)) {
      last.focus();
      event.preventDefault();
      return;
    }

    if (!event.shiftKey && active === last) {
      first.focus();
      event.preventDefault();
    }
  }
}
