import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../../application/language.service';
import { ServicesComponent } from '../../sections/services/services.component';
import { MetricsComponent } from '../../sections/metrics/metrics.component';
import { ClientsComponent } from '../../sections/clients/clients.component';
import { ProcessComponent } from '../../sections/process/process.component';
import { FaqComponent } from '../../sections/faq/faq.component';
import { ContactComponent } from '../../sections/contact/contact.component';
import { scrambleFrames } from './scramble';
import {
  nextTypewriterState,
  TYPEWRITER_START,
  TypewriterState,
  typewriterDelay,
  typewriterText,
} from './typewriter';

const FRAME_MS = 45;
/** El remate espera a que el título termine de decodificarse. */
const ACCENT_DELAY_MS = 620;

@Component({
  selector: 'app-home',
  imports: [
    ServicesComponent,
    MetricsComponent,
    ClientsComponent,
    ProcessComponent,
    FaqComponent,
    ContactComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly language = inject(LanguageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly t = this.language.t;

  // "bytek" deletreado en sus propios bytes ASCII
  readonly bytes = [
    { bits: '01100010', char: 'b' },
    { bits: '01111001', char: 'y' },
    { bits: '01110100', char: 't' },
    { bits: '01100101', char: 'e' },
    { bits: '01101011', char: 'k' },
  ];

  private readonly scrambledTitle = signal<string | null>(null);
  private readonly typed = signal<TypewriterState | null>(null);

  readonly displayTitle = computed(() => this.scrambledTitle() ?? this.t().hero.title);

  /**
   * Antes de hidratar —y con movimiento reducido— se muestra el primer remate
   * completo: el HTML servido siempre trae una frase legible y con sentido.
   */
  readonly displayAccent = computed(() => {
    const accents = this.t().hero.titleAccents;
    const state = this.typed();
    return state ? typewriterText(state, accents) : accents[0];
  });

  /**
   * Remate más largo del idioma activo. Se pinta invisible detrás del texto en
   * curso para reservar exactamente su ancho: medirlo en `ch` reservaba un 30%
   * de más, porque el "0" de Space Grotesk es más ancho que sus minúsculas.
   */
  readonly longestAccent = computed(() =>
    this.t().hero.titleAccents.reduce(
      (longest, accent) => (accent.length > longest.length ? accent : longest),
      '',
    ),
  );

  /** Un cursor real deja de parpadear mientras se escribe o se borra. */
  readonly isTyping = computed(() => {
    const phase = this.typed()?.phase;
    return phase === 'typing' || phase === 'deleting';
  });

  // En el runtime del browser los handles de setInterval y setTimeout son
  // intercambiables entre clearInterval/clearTimeout, por eso se limpian juntos.
  private timers: ReturnType<typeof setInterval | typeof setTimeout>[] = [];
  // El ciclo de escritura no termina: su temporizador se guarda aparte y se
  // reemplaza en cada paso, para no ir apilando handles en la lista de arriba.
  private typewriterTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const { title, titleAccents } = this.t().hero;
      if (!this.isBrowser || this.prefersReducedMotion()) {
        return;
      }
      this.clearTimers();
      this.decodeTitle(title);
      this.timers.push(setTimeout(() => this.typeAccents(titleAccents), ACCENT_DELAY_MS));
    });

    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Reproduce el decodificado del título y devuelve el control al texto real. */
  private decodeTitle(target: string): void {
    const frames = scrambleFrames(target);
    let next = 0;

    const interval = setInterval(() => {
      if (next >= frames.length) {
        clearInterval(interval);
        this.scrambledTitle.set(null);
        return;
      }
      this.scrambledTitle.set(frames[next++]);
    }, FRAME_MS);

    this.timers.push(interval);
  }

  /** Ciclo continuo: escribe un remate, lo sostiene, lo borra y sigue con el próximo. */
  private typeAccents(accents: readonly string[]): void {
    const advance = (state: TypewriterState) => {
      this.typed.set(state);
      this.typewriterTimer = setTimeout(
        () => advance(nextTypewriterState(state, accents)),
        typewriterDelay(state, accents),
      );
    };

    advance(TYPEWRITER_START);
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
    clearTimeout(this.typewriterTimer);
    this.scrambledTitle.set(null);
    this.typed.set(null);
  }
}
