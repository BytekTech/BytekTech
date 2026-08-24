import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { countUpValue } from './count-up';

const DURATION_MS = 1400;

/**
 * Cuenta desde cero hasta el valor indicado la primera vez que el elemento
 * entra en pantalla.
 *
 * El valor final es también el valor inicial: así el HTML prerenderizado ya
 * trae la cifra —legible sin JavaScript y para los buscadores— y la animación
 * sólo la reemplaza una vez hidratada. Quien pidió menos movimiento nunca ve
 * el conteo.
 */
@Directive({
  selector: '[appCountUp]',
  host: {
    '[textContent]': 'display()',
  },
})
export class CountUpDirective {
  readonly appCountUp = input.required<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // Parte del valor definitivo y admite que la animación lo sobrescriba.
  protected readonly display = linkedSignal(() => this.appCountUp());

  constructor() {
    afterNextRender(() => {
      if (this.prefersReducedMotion()) {
        return;
      }
      this.display.set(0);
      this.observeEntrance();
    });
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private observeEntrance(): void {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        // Se cuenta una sola vez: repetirlo en cada scroll distrae.
        observer.disconnect();
        this.run();
      },
      { threshold: 0.4 },
    );

    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private run(): void {
    const target = this.appCountUp();
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = (now - start) / DURATION_MS;
      this.display.set(countUpValue(target, progress));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(frame));
  }
}
