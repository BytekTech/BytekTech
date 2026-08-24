import { Routes } from '@angular/router';
import { HomeComponent } from './presentation/pages/home/home.component';
import { preferredLang } from './application/language.service';

// Un one-page por idioma: cada ruta se prerenderiza por separado, de modo que
// tanto el español como el inglés existen para los buscadores.
export const routes: Routes = [
  { path: 'es', component: HomeComponent },
  { path: 'en', component: HomeComponent },
  { path: '', pathMatch: 'full', redirectTo: () => `/${preferredLang()}` },
  { path: '**', redirectTo: () => `/${preferredLang()}` },
];
