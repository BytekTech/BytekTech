import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { APP_TRANSLATIONS } from './application/translations.token';
import { COMPANY_INFO } from './application/company.token';
import { ContactGateway } from './domain/gateways/contact.gateway';
import { FaqRepository } from './domain/repositories/faq.repository';
import { LegalRepository } from './domain/repositories/legal.repository';
import { MetricRepository } from './domain/repositories/metric.repository';
import { ProcessStepRepository } from './domain/repositories/process-step.repository';
import { ClientRepository } from './domain/repositories/client.repository';
import { ServiceRepository } from './domain/repositories/service.repository';
import { TRANSLATIONS } from './data/i18n/translations.data';
import { COMPANY } from './data/company/company.data';
import { HttpContactGateway } from './data/contact/http-contact.gateway';
import { ContentRepository } from './domain/repositories/content.repository';
import { PublishedContentRepository } from './data/content/published-content.repository';
import { ContentClientRepository } from './data/content/content-client.repository';
import { ContentServiceRepository } from './data/content/content-service.repository';
import { ContentMetricRepository } from './data/content/content-metric.repository';
import { ContentProcessStepRepository } from './data/content/content-process-step.repository';
import { ContentFaqRepository } from './data/content/content-faq.repository';
import { AdminSessionGateway } from './domain/gateways/admin-session.gateway';
import { ContentEditorGateway } from './domain/gateways/content-editor.gateway';
import { HttpAdminSessionGateway } from './data/admin/http-admin-session.gateway';
import { HttpContentEditorGateway } from './data/admin/http-content-editor.gateway';
import { StaticLegalRepository } from './data/legal/static-legal.repository';

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
    // Todas las secciones cuelgan del mismo contenido publicado: una sola
    // lectura por render, repartida después a cada sección.
    { provide: ContentRepository, useClass: PublishedContentRepository },
    { provide: ClientRepository, useClass: ContentClientRepository },
    { provide: ServiceRepository, useClass: ContentServiceRepository },
    { provide: MetricRepository, useClass: ContentMetricRepository },
    { provide: ProcessStepRepository, useClass: ContentProcessStepRepository },
    { provide: FaqRepository, useClass: ContentFaqRepository },
    { provide: LegalRepository, useClass: StaticLegalRepository },
    { provide: ContactGateway, useClass: HttpContactGateway },
    { provide: AdminSessionGateway, useClass: HttpAdminSessionGateway },
    { provide: ContentEditorGateway, useClass: HttpContentEditorGateway },
  ],
};
