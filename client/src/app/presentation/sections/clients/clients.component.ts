import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClientRepository } from '../../../domain/repositories/client.repository';
import { LanguageService } from '../../../application/language.service';
import { MarqueeDirective } from '../../shared/marquee.directive';
import { ClientMarkComponent } from './client-mark/client-mark.component';

@Component({
  selector: 'app-clients',
  imports: [ClientMarkComponent, MarqueeDirective],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  private readonly language = inject(LanguageService);
  private readonly clientRepository = inject(ClientRepository);

  readonly t = this.language.t;
  readonly clients = toSignal(this.clientRepository.getClients(), { initialValue: [] });

  /**
   * La cinta de abajo lleva el mismo listado al revés: corriendo en sentido
   * contrario, el orden invertido evita que las dos filas queden espejadas y
   * se lean como una sola.
   */
  readonly clientsReversed = computed(() => [...this.clients()].reverse());
}
