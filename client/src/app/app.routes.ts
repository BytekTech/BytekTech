import { Routes } from '@angular/router';
import { HomeComponent } from './presentation/pages/home/home.component';
import { TermsComponent } from './presentation/pages/terms/terms.component';
import { PublicLayoutComponent } from './presentation/layout/public-layout/public-layout.component';
import { LEGACY_TERMS_SLUGS, pathFor, routeFor } from './application/i18n/site-pages';

/**
 * Un one-page más las páginas sueltas que cuelgan de él. El idioma ya no viaja
 * en la URL, así que cada página tiene una sola dirección; las rutas viejas
 * —las que llevaban el idioma adelante— siguen resolviendo con un redirect,
 * para que ningún enlace ya compartido termine en un 404.
 *
 * Todo lo público vive dentro del layout del sitio. El panel queda fuera a
 * propósito: es la trastienda, y entra sin barra, sin pie y sin chat.
 */
export const routes: Routes = [
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
      { path: 'es', pathMatch: 'full' as const, redirectTo: '/' },
      { path: 'en', pathMatch: 'full' as const, redirectTo: '/' },
    ],
  },
  // El panel se carga aparte: no tiene por qué viajar en el bundle de quien
  // sólo entra a leer el sitio.
  {
    path: 'admin',
    loadComponent: () =>
      import('./presentation/pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '/' },
];
