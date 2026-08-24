import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { APP_TRANSLATIONS } from './application/translations.token';
import { COMPANY_INFO } from './application/company.token';
import { ContactGateway } from './domain/gateways/contact.gateway';
import { FaqRepository } from './domain/repositories/faq.repository';
import { MetricRepository } from './domain/repositories/metric.repository';
import { ProcessStepRepository } from './domain/repositories/process-step.repository';
import { ClientRepository } from './domain/repositories/client.repository';
import { ServiceRepository } from './domain/repositories/service.repository';
import { TRANSLATIONS } from './data/i18n/translations.data';
import { COMPANY } from './data/company/company.data';
import { HttpContactGateway } from './data/contact/http-contact.gateway';
import { StaticFaqRepository } from './data/faq/static-faq.repository';
import { StaticMetricRepository } from './data/metrics/static-metric.repository';
import { StaticProcessStepRepository } from './data/process/static-process-step.repository';
import { StaticClientRepository } from './data/clients/static-client.repository';
import { StaticServiceRepository } from './data/services/static-service.repository';

// Composition root: acá se conectan las abstracciones del dominio
// con sus implementaciones concretas de la capa de datos.
export const appConfig: ApplicationConfig = {
  providers: [
    // Toda la app se apoya en signals y OnPush: no hace falta zone.js.
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    { provide: APP_TRANSLATIONS, useValue: TRANSLATIONS },
    { provide: COMPANY_INFO, useValue: COMPANY },
    { provide: ClientRepository, useClass: StaticClientRepository },
    { provide: ServiceRepository, useClass: StaticServiceRepository },
    { provide: MetricRepository, useClass: StaticMetricRepository },
    { provide: ProcessStepRepository, useClass: StaticProcessStepRepository },
    { provide: FaqRepository, useClass: StaticFaqRepository },
    { provide: ContactGateway, useClass: HttpContactGateway },
  ],
};
