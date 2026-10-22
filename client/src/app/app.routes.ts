import { Routes } from '@angular/router';
import { HomeComponent } from './presentation/pages/home/home.component';
import { TermsComponent } from './presentation/pages/terms/terms.component';
import { NotFoundComponent } from './presentation/pages/not-found/not-found.component';
import { PublicLayoutComponent } from './presentation/layout/public-layout/public-layout.component';
import {
  LEGACY_HOME_SLUGS,
  LEGACY_TERMS_SLUGS,
  pathFor,
  routeFor,
} from './application/i18n/site-pages';

/**
 * Un one-page más las páginas sueltas que cuelgan de él. El idioma ya no viaja
 * en la URL, así que cada página tiene una sola dirección; las rutas viejas
 * —las que llevaban el idioma adelante— siguen resolviendo con un redirect,
 * para que ningún enlace ya compartido termine en un 404.
 *
 * Todo lo público vive dentro del layout del sitio. El panel queda fuera a
 * propósito: es la trastienda, y entra sin barra y sin pie. Va primero porque
 * el layout termina en un comodín que, si no, también lo atraparía.
 *
 * Una dirección que no existe muestra la página de "no existe", con su 404, y
 * no redirige al home: eso el buscador lo trata como un error disfrazado.
 */
export const routes: Routes = [
  // El panel se carga aparte: no tiene por qué viajar en el bundle de quien
  // sólo entra a leer el sitio.
  {
    path: routeFor('admin'),
    loadComponent: () =>
      import('./presentation/pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: HomeComponent },
      { path: routeFor('terms'), component: TermsComponent },
      ...LEGACY_TERMS_SLUGS.filter((slug) => slug !== routeFor('terms')).map((slug) => ({
        path: slug,
        redirectTo: pathFor('terms'),
      })),
      ...LEGACY_HOME_SLUGS.map((slug) => ({
        path: slug,
        pathMatch: 'full' as const,
        redirectTo: pathFor('home'),
      })),
      { path: '**', component: NotFoundComponent },
    ],
  },
];
