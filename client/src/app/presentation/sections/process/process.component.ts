import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProcessStepRepository } from '../../../domain/repositories/process-step.repository';
import { LanguageService } from '../../../application/language.service';

@Component({
  selector: 'app-process',
  templateUrl: './process.component.html',
  styleUrl: './process.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessComponent {
  private readonly language = inject(LanguageService);
  private readonly processStepRepository = inject(ProcessStepRepository);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly steps = toSignal(this.processStepRepository.getSteps(), { initialValue: [] });
}
