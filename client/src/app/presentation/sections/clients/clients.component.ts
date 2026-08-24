import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClientRepository } from '../../../domain/repositories/client.repository';
import { LanguageService } from '../../../application/language.service';
import { ClientCardComponent } from './client-card/client-card.component';

@Component({
  selector: 'app-clients',
  imports: [ClientCardComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  private readonly language = inject(LanguageService);
  private readonly clientRepository = inject(ClientRepository);

  readonly t = this.language.t;
  readonly clients = toSignal(this.clientRepository.getClients(), { initialValue: [] });
}
