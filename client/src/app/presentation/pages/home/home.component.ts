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
import { bitPattern } from '../../shared/bit-pattern';
import { decodeFrame, HeroByte, settledColumn, totalDecodeFrames } from './byte-decode';
import { pairWords, scrambleFrames } from './scramble';
import {
  nextTypewriterState,
  TYPEWRITER_START,
  TypewriterState,
  typewriterDelay,
  typewriterText,
} from './typewriter';

/*
 * Estas animaciones no consultan `prefers-reduced-motion`. En Windows esa
 * preferencia se enciende al apagar los efectos visuales del sistema —algo que
 * se hace por rendimiento, sin intención de desactivar nada en la web—, y el
 * sitio quedaba quieto en máquinas donde nadie lo había pedido. Es una decisión
 * tomada a conciencia, no un olvido.
 */

const FRAME_MS = 45;
/** El remate espera a que el título termine de decodificarse. */
const ACCENT_DELAY_MS = 620;
/** Un bit por cuadro; algo más lento que el título, que tiene mucho más que resolver. */
const BYTE_FRAME_MS = 58;

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

  /**
   * "bytek" en sus propios bytes, la misma marca generativa que identifica a
   * cada cliente. Acá se dibuja a escala de cartel: el hero es la firma de la
   * casa en grande, y las marcas de la cinta de clientes son ese mismo objeto
   * en miniatura.
   */
  readonly watermark = bitPattern('bytek');

  /**
   * Los mismos bytes, esta vez legibles. Es la clave de lectura de la marca de
   * agua: sin ella el patrón del fondo es textura y nada más.
   */
  private readonly bytes: readonly HeroByte[] = [
    { bits: '01100010', char: 'b' },
    { bits: '01111001', char: 'y' },
    { bits: '01110100', char: 't' },
    { bits: '01100101', char: 'e' },
    { bits: '01101011', char: 'k' },
  ];

  /** Cuadro de la cascada; en nulo la columna se muestra ya resuelta. */
  private readonly byteFrame = signal<number | null>(null);

  /**
   * La columna tal como se ve ahora. Antes de hidratar —y una vez terminada la
   * cascada— es la versión asentada: el HTML servido nunca trae ruido.
   */
  readonly decodedBytes = computed(() => {
    const frame = this.byteFrame();
    return frame === null ? settledColumn(this.bytes) : decodeFrame(this.bytes, frame);
  });

  private readonly scrambledTitle = signal<string | null>(null);
  private readonly typed = signal<TypewriterState | null>(null);

  private readonly displayTitle = computed(() => this.scrambledTitle() ?? this.t().hero.title);

  /**
   * El título, palabra por palabra. Cada palabra reserva en el renglón el lugar
   * de su versión definitiva: el ruido del decodificado no mide lo mismo que
   * las letras finales y, sin ese lugar reservado, el título rearmaba los
   * renglones en cada cuadro y el bloque entero bailaba.
   */
  readonly titleWords = computed(() => pairWords(this.t().hero.title, this.displayTitle()));

  /**
   * Antes de hidratar se muestra el primer remate completo: el HTML servido
   * siempre trae una frase legible y con sentido.
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
      if (!this.isBrowser) {
        return;
      }
      this.clearTimers();
      this.decodeTitle(title);
      this.decodeBytes();
      this.timers.push(setTimeout(() => this.typeAccents(titleAccents), ACCENT_DELAY_MS));
    });

    inject(DestroyRef).onDestroy(() => this.clearTimers());
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

  /**
   * Agita los bits y los va fijando en cascada. Al llegar al final suelta el
   * cuadro: la columna vuelve a su versión asentada y no queda ningún
   * temporizador vivo.
   */
  private decodeBytes(): void {
    const lastFrame = totalDecodeFrames(this.bytes.length);
    let frame = 0;

    const interval = setInterval(() => {
      if (frame >= lastFrame) {
        clearInterval(interval);
        this.byteFrame.set(null);
        return;
      }
      this.byteFrame.set(++frame);
    }, BYTE_FRAME_MS);

    this.byteFrame.set(0);
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
    this.byteFrame.set(null);
  }
}
