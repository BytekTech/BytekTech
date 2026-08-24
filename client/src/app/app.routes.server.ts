import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'es', renderMode: RenderMode.Prerender },
  { path: 'en', renderMode: RenderMode.Prerender },
  // '/' lo resuelve Express con un 302 por Accept-Language antes de llegar acá.
  { path: '**', renderMode: RenderMode.Server },
];
