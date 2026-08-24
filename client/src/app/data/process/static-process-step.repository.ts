import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ProcessStep } from '../../domain/models/process-step.model';
import { ProcessStepRepository } from '../../domain/repositories/process-step.repository';
import { PROCESS_STEPS } from './process.data';

@Injectable()
export class StaticProcessStepRepository extends ProcessStepRepository {
  getSteps(): Observable<ProcessStep[]> {
    return of(PROCESS_STEPS);
  }
}
