import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PublicLayoutComponent } from './public-layout.component';
import { routes } from '../../../app.routes';
import { contentProviders } from '../../../testing/test-providers';

describe('PublicLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...contentProviders,
      ],
    }).compileComponents();
  });

  it('should render the header wordmark', async () => {
    const fixture = TestBed.createComponent(PublicLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.wordmark')?.textContent).toContain('bytek');
  });

  it('ofrece un salto al contenido como primer elemento enfocable', async () => {
    const fixture = TestBed.createComponent(PublicLayoutComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector<HTMLAnchorElement>('.skip-link');

    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute('href')).toBe('#contenido');
    expect(compiled.querySelector('main')?.id).toBe('contenido');
  });
});
