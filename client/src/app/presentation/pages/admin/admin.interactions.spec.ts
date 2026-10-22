import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, Observable, of, Subject, throwError } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AdminSessionGateway } from '../../../domain/gateways/admin-session.gateway';
import { ContentEditorGateway } from '../../../domain/gateways/content-editor.gateway';
import { ContentSection, SiteContent } from '../../../domain/models/site-content.model';
import { ICON_MIN_PIXELS } from '../../../domain/models/client-icon';
import { ThemeService } from '../../../application/theme.service';
import { SECTION_SPECS } from './content-fields';
import {
  AcceptingEditor,
  buttonNamed,
  COLOR,
  controlsOf,
  dropOf,
  FixedContent,
  hostOf,
  OpenSession,
  pngFile,
  RejectingEditor,
  renderAdmin,
  rowsOf,
  RUBRO,
  typeInto,
} from './admin.testing';

/**
 * Cada botón y cada acción del panel, usados como los usa una persona: con
 * clics y eventos sobre la pantalla, no llamando a los métodos del componente.
 */

/** Sesión cerrada al entrar, con la clave que se le indique como la buena. */
class ClosedSession extends AdminSessionGateway {
  readonly attempts: string[] = [];
  loggedOut = false;

  constructor(private readonly validPassword = 'secreta') {
    super();
  }

  login(password: string): Observable<void> {
    this.attempts.push(password);
    return password === this.validPassword ? of(undefined) : throwError(() => ({ status: 401 }));
  }

  logout(): Observable<void> {
    this.loggedOut = true;
    return of(undefined);
  }

  isAuthenticated(): Observable<boolean> {
    return of(false);
  }
}

/** Publicación que queda en vuelo hasta que el test la resuelve. */
class PendingEditor extends ContentEditorGateway {
  readonly response = new Subject<unknown>();

  save<S extends ContentSection>(): Observable<SiteContent[S]> {
    return this.response as Observable<SiteContent[S]>;
  }
}

/** Deja correr lo que quedó encolado —promesas, el FileReader— y redibuja. */
async function settle(fixture: ComponentFixture<AdminComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

/** Espera a que se cumpla algo que depende de una lectura asíncrona del navegador. */
async function until(fixture: ComponentFixture<AdminComponent>, condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 50 && !condition(); attempt++) {
    await settle(fixture);
  }
}

function passwordInput(fixture: ComponentFixture<AdminComponent>): HTMLInputElement | null {
  return hostOf(fixture).querySelector<HTMLInputElement>('#admin-password');
}

async function loginWith(fixture: ComponentFixture<AdminComponent>, password: string): Promise<void> {
  typeInto(passwordInput(fixture) as HTMLInputElement, password);
  buttonNamed(hostOf(fixture), 'Entrar').click();
  await settle(fixture);
}

async function click(fixture: ComponentFixture<AdminComponent>, button: HTMLElement): Promise<void> {
  button.click();
  await settle(fixture);
}

function rowIds(fixture: ComponentFixture<AdminComponent>): string[] {
  return fixture.componentInstance.items().map((item) => item.id);
}

describe('AdminComponent — botones y acciones', () => {
  describe('sesión', () => {
    it('avisa que está comprobando la sesión mientras no hay respuesta', async () => {
      const session = new OpenSession();
      spyOn(session, 'isAuthenticated').and.returnValue(NEVER);
      const fixture = await renderAdmin({ session });

      expect(hostOf(fixture).textContent).toContain('Comprobando la sesión');
      expect(passwordInput(fixture)).toBeNull();
    });

    it('sin sesión muestra el ingreso y no el editor', async () => {
      const fixture = await renderAdmin({ session: new ClosedSession() });
      await settle(fixture);

      expect(passwordInput(fixture)).not.toBeNull();
      expect(hostOf(fixture).querySelector('.rows')).toBeNull();
      expect(() => buttonNamed(hostOf(fixture), 'Cerrar sesión')).toThrow();
    });

    it('«Entrar» con la clave correcta abre el editor con el contenido', async () => {
      const session = new ClosedSession('secreta');
      const fixture = await renderAdmin({ session });
      await settle(fixture);

      await loginWith(fixture, 'secreta');

      expect(session.attempts).toEqual(['secreta']);
      expect(passwordInput(fixture)).toBeNull();
      expect(rowsOf(fixture).length).toBe(2);
    });

    it('«Entrar» con una clave equivocada lo dice y no abre el editor', async () => {
      const fixture = await renderAdmin({ session: new ClosedSession('secreta') });
      await settle(fixture);

      await loginWith(fixture, 'otra');

      const alert = hostOf(fixture).querySelector('.login [role="alert"]');
      expect(alert?.textContent).toContain('No pudimos entrar con esa clave');
      expect(hostOf(fixture).querySelector('.rows')).toBeNull();
    });

    it('el ojo muestra y vuelve a ocultar la clave', async () => {
      const fixture = await renderAdmin({ session: new ClosedSession() });
      await settle(fixture);
      const reveal = hostOf(fixture).querySelector<HTMLButtonElement>('.reveal') as HTMLButtonElement;

      expect(passwordInput(fixture)?.type).toBe('password');

      await click(fixture, reveal);
      expect(passwordInput(fixture)?.type).toBe('text');
      expect(reveal.getAttribute('aria-pressed')).toBe('true');
      expect(reveal.getAttribute('aria-label')).toBe('Ocultar clave');

      await click(fixture, reveal);
      expect(passwordInput(fixture)?.type).toBe('password');
      expect(reveal.getAttribute('aria-label')).toBe('Mostrar clave');
    });

    it('«Cerrar sesión» cierra en el servidor y vuelve al ingreso', async () => {
      const session = new ClosedSession('secreta');
      const fixture = await renderAdmin({ session });
      await settle(fixture);
      await loginWith(fixture, 'secreta');

      await click(fixture, buttonNamed(hostOf(fixture), 'Cerrar sesión'));

      expect(session.loggedOut).toBeTrue();
      expect(passwordInput(fixture)).not.toBeNull();
      expect(hostOf(fixture).querySelector('.rows')).toBeNull();
    });

    it('«Volver al sitio» lleva a la portada', async () => {
      const fixture = await renderAdmin();

      expect(hostOf(fixture).querySelector('a.back')?.getAttribute('href')).toBe('/');
    });
  });

  describe('tema', () => {
    // Cómo cruza el tema lo prueba el spec del servicio; acá sólo importa que el
    // botón del panel lo pida. Dejarlo correr dispara View Transitions reales,
    // que en el navegador sin pantalla de los tests traban la corrida.
    it('el botón de tema pide alternar entre claro y oscuro', async () => {
      const fixture = await renderAdmin();
      const toggle = spyOn(TestBed.inject(ThemeService), 'toggle');
      const button = hostOf(fixture).querySelector<HTMLButtonElement>('.theme-toggle') as HTMLButtonElement;

      await click(fixture, button);
      await click(fixture, button);

      expect(toggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('pestañas e idioma', () => {
    it('hay una pestaña por sección y arranca en Clientes', async () => {
      const fixture = await renderAdmin();
      const tabs = Array.from(hostOf(fixture).querySelectorAll<HTMLButtonElement>('.tabs button'));

      expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(SECTION_SPECS.map((spec) => spec.label));
      expect(buttonNamed(hostOf(fixture), 'Clientes').getAttribute('aria-pressed')).toBe('true');
    });

    it('cada pestaña muestra su sección y marca cuál está activa', async () => {
      const fixture = await renderAdmin();

      for (const spec of SECTION_SPECS) {
        const tab = buttonNamed(hostOf(fixture).querySelector('.tabs') as HTMLElement, spec.label);
        await click(fixture, tab);

        expect(fixture.componentInstance.activeSection()).toBe(spec.section);
        expect(tab.getAttribute('aria-pressed')).toBe('true');
        expect(hostOf(fixture).querySelectorAll('.tabs .active').length).toBe(1);
      }
    });

    it('una sección vacía lo dice en vez de quedar en blanco', async () => {
      const fixture = await renderAdmin();

      await click(fixture, buttonNamed(hostOf(fixture), 'Servicios'));

      expect(hostOf(fixture).querySelector('.rows')?.textContent).toContain(
        'Todavía no hay entradas',
      );
    });

    it('cambiar de pestaña pliega las filas y borra el aviso de publicación', async () => {
      const fixture = await renderAdmin({ editor: new RejectingEditor() });
      await click(fixture, rowsOf(fixture)[0].querySelector('summary') as HTMLElement);
      await click(fixture, buttonNamed(hostOf(fixture), 'Publicar sección'));
      expect(hostOf(fixture).querySelector('.error')).not.toBeNull();

      await click(fixture, buttonNamed(hostOf(fixture), 'Servicios'));
      await click(fixture, buttonNamed(hostOf(fixture), 'Clientes'));

      expect(hostOf(fixture).querySelector('.error')).toBeNull();
      expect(fixture.componentInstance.isExpanded(0)).toBeFalse();
    });

    it('EN muestra y edita la copia en inglés sin tocar la española', async () => {
      const fixture = await renderAdmin();
      const lang = hostOf(fixture).querySelector('.lang') as HTMLElement;

      await click(fixture, buttonNamed(lang, 'EN'));
      const industry = controlsOf(rowsOf(fixture)[0])[RUBRO] as HTMLInputElement;
      expect(industry.value).toBe('Industry one');
      expect(rowsOf(fixture)[0].querySelector('.tag')?.textContent?.trim()).toBe('en');

      typeInto(industry, 'Fintech');
      await settle(fixture);

      const copy = fixture.componentInstance.items()[0].copy;
      expect(copy.en['industry']).toBe('Fintech');
      expect(copy.es['industry']).toBe('Rubro uno');

      await click(fixture, buttonNamed(lang, 'ES'));
      expect((controlsOf(rowsOf(fixture)[0])[RUBRO] as HTMLInputElement).value).toBe('Rubro uno');
    });
  });

  describe('filas', () => {
    it('la cabecera abre y vuelve a plegar la fila', async () => {
      const fixture = await renderAdmin();
      const summary = rowsOf(fixture)[0].querySelector('summary') as HTMLElement;
      const details = rowsOf(fixture)[0].querySelector('details') as HTMLDetailsElement;

      await click(fixture, summary);
      expect(details.open).toBeTrue();

      await click(fixture, summary);
      expect(details.open).toBeFalse();
    });

    it('la cabecera muestra el nombre de la entrada', async () => {
      const fixture = await renderAdmin();
      const titles = rowsOf(fixture).map((row) => row.querySelector('.row-title')?.textContent?.trim());

      expect(titles).toEqual(['Primera', 'Segunda']);
    });

    it('«Agregar» suma una fila al final, abierta', async () => {
      const fixture = await renderAdmin();

      await click(fixture, buttonNamed(hostOf(fixture), 'Agregar'));

      const rows = rowsOf(fixture);
      expect(rows.length).toBe(3);
      expect((rows[2].querySelector('details') as HTMLDetailsElement).open).toBeTrue();
    });

    it('«Subir» intercambia la fila con la de arriba', async () => {
      const fixture = await renderAdmin();

      await click(fixture, buttonNamed(rowsOf(fixture)[1], 'Subir'));

      expect(rowIds(fixture)).toEqual(['segunda', 'primera']);
    });

    it('«Bajar» intercambia la fila con la de abajo', async () => {
      const fixture = await renderAdmin();

      await click(fixture, buttonNamed(rowsOf(fixture)[0], 'Bajar'));

      expect(rowIds(fixture)).toEqual(['segunda', 'primera']);
    });

    it('«Subir» en la primera y «Bajar» en la última no hacen nada', async () => {
      const fixture = await renderAdmin();

      await click(fixture, buttonNamed(rowsOf(fixture)[0], 'Subir'));
      await click(fixture, buttonNamed(rowsOf(fixture)[1], 'Bajar'));

      expect(rowIds(fixture)).toEqual(['primera', 'segunda']);
    });

    it('«Eliminar» saca sólo esa fila', async () => {
      const fixture = await renderAdmin();

      await click(fixture, buttonNamed(rowsOf(fixture)[0], 'Eliminar'));

      expect(rowIds(fixture)).toEqual(['segunda']);
      expect(rowsOf(fixture).length).toBe(1);
    });
  });

  describe('campos', () => {
    it('el selector de color guarda el color y lo muestra escrito', async () => {
      const fixture = await renderAdmin();

      typeInto(controlsOf(rowsOf(fixture)[0])[COLOR], '#ff0000');
      await settle(fixture);

      expect(fixture.componentInstance.items()[0]['brandColor']).toBe('#ff0000');
      expect(rowsOf(fixture)[0].querySelector('.color-value')?.textContent?.trim()).toBe('#ff0000');
    });

    it('la lista guarda un entregable por renglón y descarta los vacíos', async () => {
      const fixture = await renderAdmin();
      await click(fixture, buttonNamed(hostOf(fixture), 'Servicios'));
      await click(fixture, buttonNamed(hostOf(fixture), 'Agregar'));
      const deliverables = rowsOf(fixture)[0].querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Uno por renglón"]',
      ) as HTMLTextAreaElement;

      typeInto(deliverables, '  Diseño \n\nDesarrollo\n');
      await settle(fixture);

      expect(fixture.componentInstance.items()[0].copy.es['deliverables']).toEqual([
        'Diseño',
        'Desarrollo',
      ]);
    });

    it('el selector de archivo carga el icono y muestra la vista previa', async () => {
      const fixture = await renderAdmin();
      const picker = rowsOf(fixture)[0].querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
      const transfer = new DataTransfer();
      transfer.items.add(pngFile(ICON_MIN_PIXELS));

      picker.files = transfer.files;
      picker.dispatchEvent(new Event('change'));
      await until(fixture, () => !!fixture.componentInstance.items()[0]['icon']);

      expect(fixture.componentInstance.items()[0]['icon']).toMatch(/^data:image\/png;base64,/);
      expect(rowsOf(fixture)[0].querySelector('.icon-preview')).not.toBeNull();
    });

    it('soltar un archivo sobre el campo lo carga', async () => {
      const fixture = await renderAdmin();
      const zone = rowsOf(fixture)[0].querySelector('.icon-field') as HTMLElement;

      zone.dispatchEvent(dropOf(pngFile(ICON_MIN_PIXELS)));
      await until(fixture, () => !!fixture.componentInstance.items()[0]['icon']);

      expect(fixture.componentInstance.items()[0]['icon']).toMatch(/^data:image\/png;base64,/);
    });

    it('el campo se resalta al pasar un archivo y se apaga al salir', async () => {
      const fixture = await renderAdmin();
      const zone = rowsOf(fixture)[0].querySelector('.icon-field') as HTMLElement;

      zone.dispatchEvent(dropOf(pngFile(ICON_MIN_PIXELS), 'dragover'));
      await settle(fixture);
      expect(zone.classList).toContain('drop-target');

      zone.dispatchEvent(new DragEvent('dragleave', { bubbles: true, relatedTarget: null }));
      await settle(fixture);
      expect(zone.classList).not.toContain('drop-target');
    });

    it('«Quitar» aparece con un icono puesto y lo saca', async () => {
      const fixture = await renderAdmin();
      expect(() => buttonNamed(rowsOf(fixture)[0], 'Quitar')).toThrow();

      rowsOf(fixture)[0].querySelector('.icon-field')?.dispatchEvent(dropOf(pngFile(ICON_MIN_PIXELS)));
      await until(fixture, () => !!fixture.componentInstance.items()[0]['icon']);

      await click(fixture, buttonNamed(rowsOf(fixture)[0], 'Quitar'));

      expect(fixture.componentInstance.items()[0]['icon']).toBe('');
      expect(rowsOf(fixture)[0].querySelector('.icon-preview')).toBeNull();
    });
  });

  describe('publicar', () => {
    it('«Publicar sección» manda la sección abierta y avisa que quedó publicada', async () => {
      const editor = new AcceptingEditor();
      const content = new FixedContent();
      const save = spyOn(editor, 'save').and.callThrough();
      const refresh = spyOn(content, 'refresh');
      const fixture = await renderAdmin({ editor, content });

      await click(fixture, buttonNamed(hostOf(fixture), 'Publicar sección'));

      expect(save).toHaveBeenCalledOnceWith('clients', jasmine.any(Array) as never);
      expect(save.calls.mostRecent().args[1].length).toBe(2);
      expect(refresh).toHaveBeenCalled();
      expect(hostOf(fixture).querySelector('[role="status"]')?.textContent).toContain('Publicado');
    });

    it('mientras publica, el botón se deshabilita y dice «Guardando…»', async () => {
      const editor = new PendingEditor();
      const fixture = await renderAdmin({ editor });
      const publish = buttonNamed(hostOf(fixture), 'Publicar sección');

      publish.click();
      await fixture.whenStable();

      expect(publish.disabled).toBeTrue();
      expect(publish.textContent?.trim()).toBe('Guardando…');

      editor.response.next(twoClientsItems(fixture));
      editor.response.complete();
      await settle(fixture);

      expect(publish.disabled).toBeFalse();
      expect(publish.textContent?.trim()).toBe('Publicar sección');
    });

    it('editar después de publicar borra el aviso de publicado', async () => {
      const fixture = await renderAdmin();
      await click(fixture, buttonNamed(hostOf(fixture), 'Publicar sección'));

      typeInto(controlsOf(rowsOf(fixture)[0])[0], 'Otra');
      await settle(fixture);

      expect(hostOf(fixture).querySelector('[role="status"]')).toBeNull();
    });

    const rejections: { response: unknown; says: string }[] = [
      { response: { status: 413 }, says: 'pesa demasiado' },
      { response: { error: { error: 'INVALID_ITEM' } }, says: 'campo vacío' },
      { response: { error: { error: 'DUPLICATE_ID' } }, says: 'mismo identificador' },
      { response: { error: { error: 'TOO_MANY_ITEMS' } }, says: 'más entradas de las permitidas' },
      { response: { error: { error: 'UNAUTHORIZED' } }, says: 'La sesión venció' },
      { response: { error: { error: 'ADMIN_NOT_CONFIGURED' } }, says: 'no tiene configuradas' },
      { response: { error: { error: 'CONTENT_NOT_SAVED' } }, says: 'no pudo guardar el contenido' },
      { response: { status: 500 }, says: 'No se pudo guardar' },
    ];

    for (const { response, says } of rejections) {
      it(`traduce el rechazo ${JSON.stringify(response)} a algo accionable`, async () => {
        const fixture = await renderAdmin({ editor: new RejectingEditor(response) });

        await click(fixture, buttonNamed(hostOf(fixture), 'Publicar sección'));

        const alert = hostOf(fixture).querySelector('.error[role="alert"]');
        expect(alert?.textContent).toContain(says);
      });
    }
  });
});

function twoClientsItems(fixture: ComponentFixture<AdminComponent>): unknown {
  return fixture.componentInstance.items();
}
