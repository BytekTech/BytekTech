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
import { StaticFaqRepository } from '../data/faq/static-faq.repository';
import { StaticMetricRepository } from '../data/metrics/static-metric.repository';
import { StaticProcessStepRepository } from '../data/process/static-process-step.repository';
import { StaticClientRepository } from '../data/clients/static-client.repository';
import { StaticServiceRepository } from '../data/services/static-service.repository';

/**
 * Las mismas implementaciones que usa la composition root, para que los tests
 * ejerciten el cableado real. Se mantiene aparte de app.config.ts porque los
 * specs no quieren hidratación ni router preconfigurado.
 */
export const contentProviders: Provider[] = [
  { provide: APP_TRANSLATIONS, useValue: TRANSLATIONS },
  { provide: COMPANY_INFO, useValue: COMPANY },
  { provide: ClientRepository, useClass: StaticClientRepository },
  { provide: ServiceRepository, useClass: StaticServiceRepository },
  { provide: MetricRepository, useClass: StaticMetricRepository },
  { provide: ProcessStepRepository, useClass: StaticProcessStepRepository },
  { provide: FaqRepository, useClass: StaticFaqRepository },
  { provide: ContactGateway, useClass: HttpContactGateway },
];
