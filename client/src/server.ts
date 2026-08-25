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
import { FileContentStore } from './server/content/file-content.store';
import { getContent, putSection } from './server/content/content.handler';
import {
  handleLogin,
  handleLogout,
  handleSession,
  requireAdmin,
} from './server/admin/admin.handler';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Un único almacén para todo el proceso: la caché en memoria sólo sirve si
// las peticiones comparten la misma instancia.
const contentStore = new FileContentStore();

/**
 * API endpoints. Deben registrarse antes del handler de Angular.
 */
app.post('/api/contact', express.json({ limit: '16kb' }), handleContact);

app.get('/api/content', getContent(contentStore));
app.put(
  '/api/content/:section',
  express.json({ limit: '256kb' }),
  requireAdmin,
  putSection(contentStore),
);

app.post('/api/admin/login', express.json({ limit: '4kb' }), handleLogin);
app.post('/api/admin/logout', handleLogout);
app.get('/api/admin/session', handleSession);

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
  // El contenido se lee acá y viaja con el pedido: el render no tiene por qué
  // pedirle por HTTP a este mismo servidor lo que ya puede leer del almacén.
  contentStore
    .read()
    .then((content) => angularApp.handle(req, { content }))
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
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
