import { Observable } from 'rxjs';
import { Metric } from '../models/metric.model';

export abstract class MetricRepository {
  abstract getMetrics(): Observable<Metric[]>;
}
