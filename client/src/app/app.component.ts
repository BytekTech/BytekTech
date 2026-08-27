import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './application/seo.service';

/**
 * Raíz sin cáscara: cada ruta trae su propio marco. El sitio público entra por
 * `PublicLayoutComponent`, el panel de administración se dibuja solo.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    // Basta con instanciarlo: mantiene la metadata al día por sí mismo.
    inject(SeoService);
  }
}
