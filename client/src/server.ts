import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdminHandlers } from './server/admin/admin.handler';
import { createContactHandler } from './server/contact.handler';
import { getContent, putSection } from './server/content/content.handler';
import { createServerDependencies } from './server/dependencies';
import {
  buildContentSecurityPolicy,
  createNonce,
  inlineScriptSources,
  trustedScriptHashes,
} from './server/security/content-security-policy';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
// Anunciar el framework no le sirve a ningún visitante, sólo a quien busca a qué versión apuntarle.
app.disable('x-powered-by');
const angularApp = new AngularNodeAppEngine();

// Una única instancia de cada dependencia para todo el proceso: la caché en
// memoria sólo sirve si las peticiones comparten la misma instancia.
const { contentStore, admin, contactSubmissions } = createServerDependencies();
const { requireAdmin, handleLogin, handleLogout, handleSession } = createAdminHandlers(admin);

/**
 * El template compilado trae los scripts fijos de la página; sus hashes se
 * calculan una sola vez. El servidor de desarrollo no lo escribe a disco: ahí
 * no hay hashes y la CSP admite scripts en línea (ver `inlineScriptSources`).
 */
function readTemplate(): string | null {
  try {
    return readFileSync(resolve(serverDistFolder, 'index.server.html'), 'utf-8');
  } catch {
    console.warn('No se encontró index.server.html: la CSP admite scripts en línea sin avalar.');
    return null;
  }
}
const template = readTemplate();
const scriptHashes = template === null ? Promise.resolve(null) : trustedScriptHashes(template);

/** Una CSP por pedido, con su nonce: el render lo recibe para firmar sus scripts. */
app.use((_req, res, next) => {
  scriptHashes
    .then((hashes) => {
      const nonce = createNonce();
      res.locals['cspNonce'] = nonce;
      res.setHeader(
        'Content-Security-Policy',
        buildContentSecurityPolicy(inlineScriptSources(nonce, hashes)),
      );
      next();
    })
    .catch(next);
});

/**
 * API endpoints. Deben registrarse antes del handler de Angular.
 */
app.post('/api/contact', express.json({ limit: '16kb' }), createContactHandler(contactSubmissions));

app.get('/api/content', getContent(contentStore));
app.put(
  '/api/content/:section',
  // Los iconos viajan en base64 dentro de la sección: el tope tiene que dejar
  // pasar una cinta entera de clientes con logo, no sólo dos o tres.
  express.json({ limit: '2mb' }),
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
    .then((content) => angularApp.handle(req, { content, cspNonce: res.locals['cspNonce'] }))
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Último recurso para lo que nadie atendió: un JSON mal formado, un cuerpo de
 * más, un render que falló. Al cliente le llega el código y nada más; el
 * manejador por defecto de Express, fuera de producción, devuelve la traza.
 */
app.use((error: { status?: number }, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST' });
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 * Sólo en loopback salvo que `HOST` diga otra cosa: detrás de un proxy propio,
 * nadie de la red tiene por qué llegar directo al proceso.
 */
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] || 4000);
  const host = process.env['HOST'] || '127.0.0.1';
  // `allowedHosts` admite `localhost`, no la IP: el enlace del log tiene que abrir.
  const shownHost = host === '127.0.0.1' ? 'localhost' : host;
  app.listen(port, host, () => {
    console.log(`Node Express server listening on http://${shownHost}:${port}`);
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
