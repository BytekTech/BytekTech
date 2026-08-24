import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Metric } from '../../domain/models/metric.model';
import { MetricRepository } from '../../domain/repositories/metric.repository';
import { METRICS } from './metrics.data';

@Injectable()
export class StaticMetricRepository extends MetricRepository {
  getMetrics(): Observable<Metric[]> {
    return of(METRICS);
  }
}
