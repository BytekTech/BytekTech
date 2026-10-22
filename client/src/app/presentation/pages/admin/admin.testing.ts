import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AdminComponent } from './admin.component';
import { AdminSessionGateway } from '../../../domain/gateways/admin-session.gateway';
import { ContentEditorGateway } from '../../../domain/gateways/content-editor.gateway';
import { ContentRepository } from '../../../domain/repositories/content.repository';
import { ContentSection, SiteContent } from '../../../domain/models/site-content.model';
import { FieldSpec, specFor } from './content-fields';

/**
 * Lo que comparten los tests del panel: dobles de los puertos, el contenido de
 * partida y la forma de llegar a los controles de cada fila.
 */

/** Sesión siempre abierta, salvo que el test diga otra cosa. */
export class OpenSession extends AdminSessionGateway {
  login(): Observable<void> {
    return of(undefined);
  }

  logout(): Observable<void> {
    return of(undefined);
  }

  isAuthenticated(): Observable<boolean> {
    return of(true);
  }
}

export class FixedContent extends ContentRepository {
  getContent(): Observable<SiteContent> {
    return of(twoClients());
  }
}

export class AcceptingEditor extends ContentEditorGateway {
  save<S extends ContentSection>(_section: S, items: SiteContent[S]): Observable<SiteContent[S]> {
    return of(items);
  }
}

/** El rechazo real del servidor: dice que algo no pasa, no dice qué. */
export class RejectingEditor extends ContentEditorGateway {
  constructor(private readonly response: unknown = { error: { error: 'INVALID_ITEM' } }) {
    super();
  }

  save<S extends ContentSection>(): Observable<SiteContent[S]> {
    return throwError(() => this.response);
  }
}

/** Dos clientes: con uno solo el índice equivocado pasaría desapercibido. */
export function twoClients(): SiteContent {
  return {
    services: [],
    metrics: [],
    steps: [],
    faqs: [],
    clients: [
      {
        id: 'primera',
        name: 'Primera',
        since: 2022,
        copy: {
          es: { industry: 'Rubro uno', summary: 'Resumen uno.' },
          en: { industry: 'Industry one', summary: 'Summary one.' },
        },
      },
      {
        id: 'segunda',
        name: 'Segunda',
        since: 2023,
        copy: {
          es: { industry: 'Rubro dos', summary: 'Resumen dos.' },
          en: { industry: 'Industry two', summary: 'Summary two.' },
        },
      },
    ],
  };
}

export interface AdminDoubles {
  editor?: ContentEditorGateway;
  session?: AdminSessionGateway;
  content?: ContentRepository;
}

export async function renderAdmin(
  doubles: AdminDoubles = {},
): Promise<ComponentFixture<AdminComponent>> {
  TestBed.configureTestingModule({
    imports: [AdminComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AdminSessionGateway, useValue: doubles.session ?? new OpenSession() },
      { provide: ContentRepository, useValue: doubles.content ?? new FixedContent() },
      { provide: ContentEditorGateway, useValue: doubles.editor ?? new AcceptingEditor() },
    ],
  });

  const fixture = TestBed.createComponent(AdminComponent);
  await fixture.whenStable();
  return fixture;
}

export function hostOf(fixture: ComponentFixture<AdminComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

export function rowsOf(fixture: ComponentFixture<AdminComponent>): HTMLElement[] {
  return Array.from(hostOf(fixture).querySelectorAll<HTMLElement>('.rows > li'));
}

/**
 * Los controles de una fila, en el orden en que la sección declara sus campos.
 * Para clientes: nombre, año, sitio, color, icono, rubro, resumen.
 */
export function controlsOf(row: HTMLElement): HTMLElement[] {
  return Array.from(row.querySelectorAll<HTMLElement>('.field input, .field textarea'));
}

export const NOMBRE = 0;
export const DESDE = 1;
export const SITIO = 2;
export const COLOR = 3;
export const RUBRO = 5;

export function typeInto(control: HTMLElement, value: string): void {
  const field = control as HTMLInputElement | HTMLTextAreaElement;
  field.value = value;
  field.dispatchEvent(new Event('input'));
}

export function leave(control: HTMLElement): void {
  control.dispatchEvent(new Event('blur'));
}

/** El botón visible con ese texto, dentro de `scope`. Falla si no está. */
export function buttonNamed(scope: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!button) {
    throw new Error(`No hay un botón "${text}"`);
  }
  return button;
}

export function iconField(): FieldSpec {
  const field = specFor('clients').fields.find((candidate) => candidate.key === 'icon');
  if (!field) {
    throw new Error('La sección de clientes perdió el campo del icono');
  }
  return field;
}

/** Un PNG con la cabecera real: alcanza para que se le lea la medida. */
export function pngFile(side: number, padding = 0): File {
  const bytes = new Uint8Array(24 + padding);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes[11] = 13;
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  bytes[18] = (side >>> 8) & 0xff;
  bytes[19] = side & 0xff;
  bytes[22] = (side >>> 8) & 0xff;
  bytes[23] = side & 0xff;
  return new File([bytes], 'logo.png', { type: 'image/png' });
}

/** El control de archivo, sin depender de poder fabricar un FileList real. */
export function fileInput(file?: File): HTMLInputElement {
  return { files: file ? [file] : [], value: 'logo.png' } as unknown as HTMLInputElement;
}

/** Un archivo arrastrado, como lo entrega el navegador. */
export function dropOf(file: File, type: 'drop' | 'dragover' = 'drop'): DragEvent {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  return new DragEvent(type, { dataTransfer: transfer, bubbles: true, cancelable: true });
}
