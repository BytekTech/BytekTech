import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ContentRepository } from '../../domain/repositories/content.repository';
import { Metric } from '../../domain/models/metric.model';
import { MetricRepository } from '../../domain/repositories/metric.repository';

/** Métricas publicadas desde el panel. */
@Injectable()
export class ContentMetricRepository extends MetricRepository {
  private readonly content = inject(ContentRepository);

  getMetrics(): Observable<Metric[]> {
    return this.content.getContent().pipe(map((content) => content.metrics));
  }
}
