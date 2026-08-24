import { Observable } from 'rxjs';
import { Service } from '../models/service.model';

export abstract class ServiceRepository {
  abstract getServices(): Observable<Service[]>;
}
