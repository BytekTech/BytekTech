import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  copiesNeeded,
  directionSign,
  frameDistance,
  MarqueeDirection,
  wrapOffset,
} from './marquee';

/** Velocidad de crucero, en píxeles por segundo: acompaña la lectura, no obliga a seguirla. */
const SPEED_PX_PER_SECOND = 32;

/** Movimiento mínimo para tratar el gesto como arrastre y no como clic. */
const DRAG_THRESHOLD_PX = 4;

/** Respiro tras soltar el dedo, para que el gesto no compita con la marcha. */
const RESUME_DELAY_MS = 900;

/** Aire entre el elemento que recibe el foco y el borde de la ventana. */
const FOCUS_MARGIN_PX = 24;

/** Saca del tabulador todo lo que se pueda enfocar dentro de un elemento. */
function keepOutOfTabOrder(element: HTMLElement): void {
  element
    .querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')
    .forEach((focusable) => focusable.setAttribute('tabindex', '-1'));
}

/*
 * Estas animaciones no consultan `prefers-reduced-motion`. En Windows esa
 * preferencia se enciende al apagar los efectos visuales del sistema —algo que
 * se hace por rendimiento, sin intención de desactivar nada en la web—, y el
 * sitio quedaba quieto en máquinas donde nadie lo había pedido. Es una decisión
 * tomada a conciencia, no un olvido.
 */

/**
 * Convierte una lista en una cinta que corre de derecha a izquierda sin fin.
 *
 * La plantilla escribe el listado una sola vez —lo que leen los buscadores y
 * los lectores de pantalla—; las copias que hagan falta para tapar la ventana
 * las clona esta directiva y las esconde de la accesibilidad.
 *
 * El movimiento se frena mientras el puntero está encima, mientras se arrastra
 * y mientras el foco está adentro, y no arranca mientras la sección no esté a
 * la vista.
 *
 * `marqueeDirection` elige el sentido de la marcha; el arrastre manda siempre
 * para los dos lados.
 */
@Directive({
  selector: '[appMarquee]',
  host: {
    '[class.grabbed]': 'grabbed()',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'hovering.set(false)',
    '(pointerdown)': 'startDrag($event)',
    '(pointermove)': 'continueDrag($event)',
    '(pointerup)': 'endDrag($event)',
    '(pointercancel)': 'endDrag($event)',
    '(click)': 'swallowClickAfterDrag($event)',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'focused.set(false)',
  },
})
export class MarqueeDirective {
  readonly direction = input<MarqueeDirection>('left', { alias: 'marqueeDirection' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hovering = signal(false);
  protected readonly focused = signal(false);
  protected readonly grabbed = signal(false);
  private readonly onScreen = signal(false);
  private readonly measured = signal(false);

  private readonly moving = computed(
    () =>
      this.measured() &&
      this.onScreen() &&
      !this.hovering() &&
      !this.focused() &&
      !this.grabbed(),
  );

  /** Píxeles recorridos dentro de la copia actual. */
  private offset = 0;
  /** Ancho de una copia del listado, incluido el espacio que la separa de la siguiente. */
  private span = 0;
  private clones: HTMLElement[] = [];
  private drag: { pointerId: number; startX: number; startOffset: number } | null = null;
  private dragged = false;
  private resumeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.rebuild();
      this.watchWidth();
      this.watchVisibility();
      this.measured.set(true);
    });

    effect((onCleanup) => {
      if (!this.moving()) {
        return;
      }

      const sign = directionSign(this.direction());
      let frame = 0;
      let previous = performance.now();

      const step = (now: number) => {
        this.shiftTo(this.offset + sign * frameDistance(now - previous, SPEED_PX_PER_SECOND));
        previous = now;
        frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);
      onCleanup(() => cancelAnimationFrame(frame));
    });

    this.destroyRef.onDestroy(() => clearTimeout(this.resumeTimer));
  }

  /**
   * Rehace las copias y vuelve a medir el bucle. Se parte siempre del listado
   * original —el que maneja Angular— para que un cambio de ancho o de datos no
   * arrastre clones viejos.
   */
  private rebuild(): void {
    const track = this.host.nativeElement;
    this.clones.forEach((clone) => clone.remove());
    this.clones = [];

    const originals = Array.from(track.children) as HTMLElement[];
    if (originals.length === 0) {
      return;
    }

    // Una cinta que el template declara decorativa tampoco aporta paradas al
    // tabulador: lo que no se anuncia, no se tabula.
    if (track.getAttribute('aria-hidden') === 'true') {
      originals.forEach((item) => keepOutOfTabOrder(item));
    }

    // La primera copia da la medida exacta del bucle: la distancia entre un
    // elemento y su clon incluye el espacio que los separa.
    this.appendCopy(originals);
    const firstClone = track.children[originals.length] as HTMLElement;
    this.span = firstClone.offsetLeft - originals[0].offsetLeft;

    const viewportWidth = track.parentElement?.clientWidth ?? 0;
    for (let copy = 2; copy < copiesNeeded(viewportWidth, this.span); copy++) {
      this.appendCopy(originals);
    }

    this.shiftTo(this.offset);
  }

  private appendCopy(originals: HTMLElement[]): void {
    const copy = originals.map((item) => {
      const clone = item.cloneNode(true) as HTMLElement;
      // La copia es decorativa: ni la anuncian los lectores ni la alcanza el
      // tabulador. No lleva `inert`, que además apagaría el puntero y dejaría
      // la mayor parte de la cinta sin frenado, sin arrastre y sin encendido.
      clone.setAttribute('aria-hidden', 'true');
      keepOutOfTabOrder(clone);
      return clone;
    });

    this.clones.push(...copy);
    this.host.nativeElement.append(...copy);
  }

  private shiftTo(offset: number): void {
    if (this.span <= 0) {
      return;
    }
    this.offset = wrapOffset(offset, this.span);
    this.host.nativeElement.style.transform = 'translate3d(' + -this.offset + 'px, 0, 0)';
  }

  /**
   * Frenar bajo el puntero es cosa del mouse. El dedo no se posa: entra al
   * tocar y sale al soltar, y si el navegador cancela el gesto para desplazar
   * la página hay casos en los que la salida nunca llega. La cinta quedaba
   * detenida para siempre después del primer scroll que pasara por encima.
   */
  protected onPointerEnter(event: PointerEvent): void {
    this.hovering.set(event.pointerType === 'mouse');
  }

  protected startDrag(event: PointerEvent): void {
    if (event.button !== 0 || this.span <= 0) {
      return;
    }

    clearTimeout(this.resumeTimer);
    this.dragged = false;
    this.grabbed.set(true);
    this.drag = { pointerId: event.pointerId, startX: event.clientX, startOffset: this.offset };
    this.host.nativeElement.setPointerCapture(event.pointerId);
  }

  protected continueDrag(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }

    const travel = drag.startX - event.clientX;
    if (Math.abs(travel) >= DRAG_THRESHOLD_PX) {
      this.dragged = true;
    }
    this.shiftTo(drag.startOffset + travel);
  }

  protected endDrag(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) {
      return;
    }

    const track = this.host.nativeElement;
    this.drag = null;
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    // El puntero fino sigue en pantalla: ahí manda si quedó encima. El dedo, en
    // cambio, ya se fue, así que la cinta retoma la marcha tras un respiro.
    if (event.pointerType === 'mouse') {
      this.grabbed.set(false);
      return;
    }
    this.resumeTimer = setTimeout(() => this.grabbed.set(false), RESUME_DELAY_MS);
  }

  protected swallowClickAfterDrag(event: MouseEvent): void {
    if (!this.dragged) {
      return;
    }
    // Arrastrar por encima de un enlace no debe terminar abriéndolo.
    event.preventDefault();
    event.stopPropagation();
    this.dragged = false;
  }

  protected onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    const viewport = this.host.nativeElement.parentElement;

    // Sólo el foco del teclado detiene la cinta. Un toque sobre una tarjeta
    // también enfoca su enlace, y en pantallas táctiles nada devuelve ese foco:
    // la marcha no volvía a arrancar en el resto de la visita.
    this.focused.set(!!target?.matches(':focus-visible'));

    if (!target || !viewport) {
      return;
    }

    // El tabulador puede llegar a una tarjeta que quedó fuera de la ventana:
    // como la cinta no usa scroll nativo, hay que traerla a mano.
    const item = target.getBoundingClientRect();
    const frame = viewport.getBoundingClientRect();
    const overflowRight = item.right - frame.right;
    const overflowLeft = frame.left - item.left;

    if (overflowRight > 0) {
      this.shiftTo(this.offset + overflowRight + FOCUS_MARGIN_PX);
    } else if (overflowLeft > 0) {
      this.shiftTo(this.offset - overflowLeft - FOCUS_MARGIN_PX);
    }
  }

  private watchWidth(): void {
    const viewport = this.host.nativeElement.parentElement;
    if (!viewport) {
      return;
    }

    let width = viewport.clientWidth;
    const observer = new ResizeObserver(() => {
      if (viewport.clientWidth === width) {
        return;
      }
      width = viewport.clientWidth;
      this.rebuild();
    });

    observer.observe(viewport);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private watchVisibility(): void {
    const observer = new IntersectionObserver(([entry]) => this.onScreen.set(entry.isIntersecting));
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
