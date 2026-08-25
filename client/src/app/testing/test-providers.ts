import { Provider } from '@angular/core';
import { APP_TRANSLATIONS } from '../application/translations.token';
import { COMPANY_INFO } from '../application/company.token';
import { ContactGateway } from '../domain/gateways/contact.gateway';
import { FaqRepository } from '../domain/repositories/faq.repository';
import { MetricRepository } from '../domain/repositories/metric.repository';
import { ProcessStepRepository } from '../domain/repositories/process-step.repository';
import { ClientRepository } from '../domain/repositories/client.repository';
import { ServiceRepository } from '../domain/repositories/service.repository';
import { TRANSLATIONS } from '../data/i18n/translations.data';
import { COMPANY } from '../data/company/company.data';
import { HttpContactGateway } from '../data/contact/http-contact.gateway';
import { ContentRepository } from '../domain/repositories/content.repository';
import { SeedContentRepository } from './seed-content.repository';
import { ContentClientRepository } from '../data/content/content-client.repository';
import { ContentServiceRepository } from '../data/content/content-service.repository';
import { ContentMetricRepository } from '../data/content/content-metric.repository';
import { ContentProcessStepRepository } from '../data/content/content-process-step.repository';
import { ContentFaqRepository } from '../data/content/content-faq.repository';

/**
 * Las mismas implementaciones que usa la composition root, para que los tests
 * ejerciten el cableado real. Se mantiene aparte de app.config.ts porque los
 * specs no quieren hidratación ni router preconfigurado.
 */
export const contentProviders: Provider[] = [
  { provide: APP_TRANSLATIONS, useValue: TRANSLATIONS },
  { provide: COMPANY_INFO, useValue: COMPANY },
  { provide: ContentRepository, useClass: SeedContentRepository },
  { provide: ClientRepository, useClass: ContentClientRepository },
  { provide: ServiceRepository, useClass: ContentServiceRepository },
  { provide: MetricRepository, useClass: ContentMetricRepository },
  { provide: ProcessStepRepository, useClass: ContentProcessStepRepository },
  { provide: FaqRepository, useClass: ContentFaqRepository },
  { provide: ContactGateway, useClass: HttpContactGateway },
];
