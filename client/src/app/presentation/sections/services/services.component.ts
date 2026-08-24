import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceRepository } from '../../../domain/repositories/service.repository';
import { LanguageService } from '../../../application/language.service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent {
  private readonly language = inject(LanguageService);
  private readonly serviceRepository = inject(ServiceRepository);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly services = toSignal(this.serviceRepository.getServices(), { initialValue: [] });
}
