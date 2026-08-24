import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FaqEntry } from '../../../domain/models/faq.model';
import { FaqRepository } from '../../../domain/repositories/faq.repository';
import { LanguageService } from '../../../application/language.service';
import { FocusTrapDirective } from '../../shared/focus-trap.directive';

interface ChatMessage {
  role: 'user' | 'bot';
  /** null = mensaje de bienvenida */
  faqId: string | null;
}

const TYPING_MS = 700;

@Component({
  selector: 'app-chatbot',
  imports: [FocusTrapDirective],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class ChatbotComponent {
  private readonly language = inject(LanguageService);
  private readonly faqRepository = inject(FaqRepository);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly faqs = toSignal(this.faqRepository.getFaqs(), { initialValue: [] });

  readonly isOpen = signal(false);
  readonly isTyping = signal(false);
  readonly messages = signal<ChatMessage[]>([{ role: 'bot', faqId: null }]);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly thread = viewChild<ElementRef<HTMLElement>>('thread');
  private readonly toggleButton = viewChild<ElementRef<HTMLElement>>('toggleButton');

  toggle(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }
    this.isOpen.set(true);
    setTimeout(() => this.panel()?.nativeElement.focus(), 0);
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.toggleButton()?.nativeElement.focus();
  }

  ask(faq: FaqEntry): void {
    if (this.isTyping()) {
      return;
    }

    this.append({ role: 'user', faqId: faq.id });

    if (this.prefersReducedMotion()) {
      this.append({ role: 'bot', faqId: faq.id });
      return;
    }

    this.isTyping.set(true);
    setTimeout(() => {
      this.isTyping.set(false);
      this.append({ role: 'bot', faqId: faq.id });
    }, TYPING_MS);
  }

  // Se renderiza desde el diccionario vigente, así la conversación
  // completa se re-traduce al cambiar de idioma.
  textFor(message: ChatMessage): string {
    if (message.faqId === null) {
      return this.t().chatbot.greeting;
    }
    const faq = this.faqs().find((entry) => entry.id === message.faqId);
    if (!faq) {
      return '';
    }
    const copy = faq.copy[this.lang()];
    return message.role === 'user' ? copy.question : copy.answer;
  }

  private append(message: ChatMessage): void {
    this.messages.update((messages) => [...messages, message]);
    setTimeout(() => {
      const threadElement = this.thread()?.nativeElement;
      if (threadElement) {
        threadElement.scrollTop = threadElement.scrollHeight;
      }
    }, 0);
  }

  private prefersReducedMotion(): boolean {
    return this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
