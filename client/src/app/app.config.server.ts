import { provideServerRendering, withRoutes } from '@angular/ssr';
import {
  mergeApplicationConfig,
  ApplicationConfig,
  CSP_NONCE,
  inject,
  REQUEST_CONTEXT,
} from '@angular/core';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/** Lo que el servidor adjunta al pedido para firmar los scripts en línea. */
interface CspRenderContext {
  cspNonce?: string;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // El nonce de la CSP de este pedido: Angular lo pone en los scripts que
    // arma al renderizar, y sin él el navegador no los ejecutaría.
    {
      provide: CSP_NONCE,
      useFactory: () =>
        (inject(REQUEST_CONTEXT, { optional: true }) as CspRenderContext | null)?.cspNonce ?? null,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
