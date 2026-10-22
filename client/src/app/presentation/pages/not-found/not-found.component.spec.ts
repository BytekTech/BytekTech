import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, RESPONSE_INIT } from '@angular/core';
import { provideRouter } from '@angular/router';
import { contentProviders } from '../../../testing/test-providers';
import { LanguageService } from '../../../application/language.service';
import { NotFoundComponent } from './not-found.component';

function render(responseInit?: ResponseInit): HTMLElement {
  TestBed.configureTestingModule({
    imports: [NotFoundComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      ...contentProviders,
      ...(responseInit ? [{ provide: RESPONSE_INIT, useValue: responseInit }] : []),
    ],
  });
  TestBed.inject(LanguageService).set('es');
  const fixture = TestBed.createComponent(NotFoundComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('NotFoundComponent', () => {
  it('responde con 404 cuando se renderiza en el servidor', () => {
    const responseInit: ResponseInit = { status: 200 };

    render(responseInit);

    expect(responseInit.status).toBe(404);
  });

  it('se renderiza también sin respuesta HTTP, en el navegador', () => {
    expect(() => render()).not.toThrow();
  });

  it('tiene un único título que dice que la página no existe', () => {
    const headings = render().querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('no existe');
  });

  it('ofrece volver al inicio y escribir a contacto', () => {
    const links = Array.from(render().querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(links).toEqual(['/', '/#contacto']);
  });

  it('deja el número grande fuera del lector de pantalla', () => {
    expect(render().querySelector('.code')?.getAttribute('aria-hidden')).toBe('true');
  });
});
