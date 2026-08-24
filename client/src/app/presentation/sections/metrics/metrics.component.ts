import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MetricRepository } from '../../../domain/repositories/metric.repository';
import { LanguageService } from '../../../application/language.service';
import { CountUpDirective } from '../../shared/count-up.directive';

@Component({
  selector: 'app-metrics',
  imports: [CountUpDirective],
  templateUrl: './metrics.component.html',
  styleUrl: './metrics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsComponent {
  private readonly language = inject(LanguageService);
  private readonly metricRepository = inject(MetricRepository);

  readonly t = this.language.t;
  readonly lang = this.language.lang;
  readonly metrics = toSignal(this.metricRepository.getMetrics(), { initialValue: [] });
}
