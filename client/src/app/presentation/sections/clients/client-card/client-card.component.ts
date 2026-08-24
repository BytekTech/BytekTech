import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Client } from '../../../../domain/models/client.model';
import { LanguageService } from '../../../../application/language.service';
import { bitPattern } from '../../../shared/bit-pattern';

/**
 * Semilla del patrón: cinco caracteres, los mismos que tiene "bytek". Sin
 * recortar, un nombre largo dibuja una mancha del doble de ancho que uno corto
 * y la grilla de tarjetas pierde el pulso.
 */
function markSeed(name: string): string {
  return name.replace(/\s+/g, '').slice(0, 5).toLowerCase();
}

@Component({
  selector: 'app-client-card',
  templateUrl: './client-card.component.html',
  styleUrl: './client-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientCardComponent {
  private readonly language = inject(LanguageService);

  readonly client = input.required<Client>();

  readonly copy = computed(() => this.client().copy[this.language.lang()]);
  readonly bits = computed(() => bitPattern(markSeed(this.client().name)));
  readonly t = this.language.t;
}
