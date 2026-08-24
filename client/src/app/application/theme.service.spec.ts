import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    delete document.documentElement.dataset['theme'];
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    delete document.documentElement.dataset['theme'];
  });

  it('arranca con el tema que el visitante había elegido', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('escribe el tema en el html y lo persiste al alternar', () => {
    const service = TestBed.inject(ThemeService);
    const initial = service.theme();

    service.toggle();
    TestBed.tick();

    expect(service.theme()).not.toBe(initial);
    expect(document.documentElement.dataset['theme']).toBe(service.theme());
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(service.theme());
  });

  it('vuelve al tema anterior al alternar dos veces', () => {
    const service = TestBed.inject(ThemeService);
    const initial = service.theme();

    service.toggle();
    service.toggle();
    TestBed.tick();

    expect(service.theme()).toBe(initial);
  });
});
