import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ContentRepository } from '../../domain/repositories/content.repository';
import { ProcessStep } from '../../domain/models/process-step.model';
import { ProcessStepRepository } from '../../domain/repositories/process-step.repository';

/** Etapas publicadas desde el panel, siempre en el orden que declara cada una. */
@Injectable()
export class ContentProcessStepRepository extends ProcessStepRepository {
  private readonly content = inject(ContentRepository);

  getSteps(): Observable<ProcessStep[]> {
    return this.content
      .getContent()
      .pipe(map((content) => [...content.steps].sort((a, b) => a.order - b.order)));
  }
}
