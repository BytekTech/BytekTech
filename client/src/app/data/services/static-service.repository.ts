import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Service } from '../../domain/models/service.model';
import { ServiceRepository } from '../../domain/repositories/service.repository';
import { SERVICES } from './services.data';

@Injectable()
export class StaticServiceRepository extends ServiceRepository {
  getServices(): Observable<Service[]> {
    return of(SERVICES);
  }
}
