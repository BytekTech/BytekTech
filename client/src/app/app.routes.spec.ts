import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { routes } from './app.routes';
import { contentProviders } from './testing/test-providers';

/**
 * El panel cuelga fuera del layout público, así que la tabla de rutas tiene que
 * poder salirse del padre que envuelve al sitio. Es justo lo que se rompe sin
 * hacer ruido: compila igual y falla recién al navegar.
 */
describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...contentProviders,
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('sirve el sitio dentro del layout público', async () => {
    await harness.navigateByUrl('/');

    expect(harness.routeNativeElement?.querySelector('app-header')).not.toBeNull();
  });

  it('abre el panel sin la cáscara del sitio', async () => {
    await harness.navigateByUrl('/admin');
    const page = TestBed.inject(Router).routerState.snapshot.url;
    const shell = document.querySelector('app-header, app-footer, app-chatbot');

    expect(page).toBe('/admin');
    expect(shell).toBeNull();
  });

  it('mantiene vivas las direcciones viejas de los términos', async () => {
    await harness.navigateByUrl('/es/terminos');

    expect(TestBed.inject(Router).routerState.snapshot.url).toBe('/terms');
  });

  it('manda al home cualquier dirección que no exista', async () => {
    await harness.navigateByUrl('/no-existe');

    expect(TestBed.inject(Router).routerState.snapshot.url).toBe('/');
  });
});
