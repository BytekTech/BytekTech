import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleContact } from './server/contact.handler';
import { DEFAULT_LANG, langFromAcceptLanguage } from './app/domain/models/language.model';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * API endpoints. Deben registrarse antes del handler de Angular.
 */
app.post('/api/contact', express.json({ limit: '16kb' }), handleContact);

/**
 * La raíz no tiene contenido propio: deriva al one-page del idioma del visitante.
 * Se resuelve acá, con un 302, para que los buscadores lleguen directo a /es o /en
 * en vez de a un redirect en el cliente.
 */
app.get('/', (req, res) => {
  const lang = langFromAcceptLanguage(req.headers['accept-language'] ?? '') ?? DEFAULT_LANG;
  res.redirect(302, `/${lang}`);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
