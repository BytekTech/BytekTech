import { Observable } from 'rxjs';
import { ProcessStep } from '../models/process-step.model';

export abstract class ProcessStepRepository {
  abstract getSteps(): Observable<ProcessStep[]>;
}
