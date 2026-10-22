import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconSourcePipe } from '../../shared/icon-source.pipe';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Lang, SUPPORTED_LANGS } from '../../../domain/models/language.model';
import { ContentSection, SiteContent } from '../../../domain/models/site-content.model';
import { ContentRepository } from '../../../domain/repositories/content.repository';
import { AdminSessionGateway } from '../../../domain/gateways/admin-session.gateway';
import { ContentEditorGateway } from '../../../domain/gateways/content-editor.gateway';
import { ICON_MAX_BYTES, IconIssue, iconIssue } from '../../../domain/models/client-icon';
import {
  EditableItem,
  explainIconIssue,
  FieldSpec,
  fieldIssue,
  ICON_ACCEPT,
  itemBlocksPublishing,
  langBlocksPublishing,
  SECTION_SPECS,
  specFor,
} from './content-fields';

/** Lee el archivo como data URI. Devuelve vacío si el navegador no pudo. */
function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/** Si lo que se arrastra son archivos y no, por ejemplo, un texto seleccionado. */
function carriesFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('Files') ?? false;
}

type SaveState ='idle' | 'saving' | 'saved' | 'failed';

/** Borrador de trabajo: el contenido tal como se está editando, aún sin publicar. */
type Draft = Record<ContentSection, EditableItem[]>;

@Component({
  selector: 'app-admin',
  imports: [RouterLink, IconSourcePipe, ThemeToggleComponent],
  templateUrl: './admin.component.html',
  // Tres hojas, en orden de afuera hacia adentro: la cáscara, la lista de
  // entradas y los campos de una entrada abierta.
  styleUrls: ['./admin.component.scss', './admin-rows.scss', './admin-fields.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:dragover)': 'ignoreStrayDrop($event)',
    '(document:drop)': 'ignoreStrayDrop($event)',
  },
})
export class AdminComponent {
  private readonly session = inject(AdminSessionGateway);
  private readonly editor = inject(ContentEditorGateway);
  private readonly content = inject(ContentRepository);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly langs = SUPPORTED_LANGS;
  /** El botón muestra el código; el nombre completo queda para el lector de pantalla. */
  readonly langNames: Record<Lang, string> = { es: 'Español', en: 'Inglés' };
  readonly specs = SECTION_SPECS;

  readonly isAuthenticated = signal(false);
  readonly isChecking = signal(true);
  readonly loginError = signal('');
  /** Si la clave se ve en claro: quien la escribe a ciegas no tiene cómo notar un error de tipeo. */
  readonly isPasswordVisible = signal(false);

  readonly activeSection = signal<ContentSection>('clients');
  readonly activeLang = signal<Lang>('es');
  readonly saveState = signal<SaveState>('idle');
  readonly saveError = signal('');

  private readonly draft = signal<Draft | null>(null);
  /**
   * Qué filas están abiertas: la lista se lee de un vistazo y se edita de a una.
   * Se sigue por posición, que es como las identifican las acciones de la fila
   * —subir, bajar, eliminar— y lo que cambia cuando se reordenan.
   */
  private readonly expanded = signal<ReadonlySet<number>>(new Set());

  /**
   * Si hay que señalar lo que falta. Se enciende recién con el primer rechazo:
   * una fila recién agregada está vacía por definición, y recibirla ya en rojo
   * sería retarle al usuario por algo que todavía no hizo. Una vez encendido se
   * apaga campo por campo, a medida que se completan.
   */
  private readonly showIssues = signal(false);

  /** El último icono rechazado, con su motivo. Se elige de a un archivo por vez. */
  private readonly rejectedIcon = signal<{ row: number; message: string } | null>(null);

  /** La fila sobre cuyo campo de icono se está arrastrando un archivo. */
  private readonly iconDropRow = signal<number | null>(null);

  readonly iconAccept = ICON_ACCEPT;

  readonly spec = computed(() => specFor(this.activeSection()));
  readonly items = computed(() => this.draft()?.[this.activeSection()] ?? []);

  constructor() {
    // Que no se indexe lo resuelve el SeoService, igual que para el resto de
    // las páginas; el título es propio porque el panel no se traduce.
    inject(Title).setTitle('Panel — Bytek Technology');
    // La sesión vive en una cookie del navegador: preguntar por ella durante
    // el render del servidor no tendría a quién preguntarle.
    if (this.isBrowser) {
      void this.restoreSession();
    }
  }

  isExpanded(index: number): boolean {
    return this.expanded().has(index);
  }

  toggle(index: number): void {
    this.expanded.update((open) => {
      const next = new Set(open);
      if (!next.delete(index)) {
        next.add(index);
      }
      return next;
    });
  }

  titleFor(item: EditableItem): string {
    return this.spec().title(item, this.activeLang()) || item.id;
  }

  /** Valor que muestra un campo, ya sea propio del ítem o de su bloque de idioma. */
  valueOf(item: EditableItem, field: FieldSpec): string {
    const raw = field.perLang ? item.copy?.[this.activeLang()]?.[field.key] : item[field.key];
    if (Array.isArray(raw)) {
      return raw.join('\n');
    }
    return raw === undefined || raw === null ? '' : String(raw);
  }

  /**
   * Qué le falta a este campo para poder publicar, o `null` si no le falta
   * nada. El borde rojo solo decía que algo estaba mal; esto dice qué.
   */
  issueOf(item: EditableItem, field: FieldSpec): string | null {
    return this.showIssues() ? fieldIssue(item, field, this.activeLang()) : null;
  }

  /** Si a la fila le falta algo, en cualquier campo y en cualquier idioma. */
  rowHasIssue(item: EditableItem): boolean {
    return this.showIssues() && itemBlocksPublishing(item, this.spec());
  }

  /**
   * Si lo que falta está en el otro idioma. Sin esto el rechazo era un misterio:
   * el campo incompleto estaba en inglés, la pantalla mostraba el español y no
   * había nada en rojo a la vista.
   */
  langHasIssue(lang: Lang): boolean {
    return (
      this.showIssues() &&
      this.items().some((item) => langBlocksPublishing(item, this.spec(), lang))
    );
  }

  /**
   * Nombre del idioma para el lector de pantalla. El rojo del botón no se
   * anuncia solo: quien no lo ve necesita que lo diga el nombre.
   */
  langLabel(lang: Lang): string {
    const name = this.langNames[lang];
    return this.langHasIssue(lang) ? `${name} — faltan campos` : name;
  }

  update(index: number, field: FieldSpec, rawValue: string): void {
    const value = this.parse(field, rawValue);
    this.editItem(index, (item) => {
      if (!field.perLang) {
        return { ...item, [field.key]: value };
      }
      const lang = this.activeLang();
      return {
        ...item,
        copy: { ...item.copy, [lang]: { ...item.copy[lang], [field.key]: value } },
      };
    });
  }

  /**
   * Toma el archivo elegido, lo revisa entero y lo guarda embebido.
   *
   * El rechazo se dice acá y no al publicar: quien acaba de elegir un archivo
   * necesita enterarse en el momento de que ese no va, y con qué se queda corto.
   */
  pickIcon(row: number, field: FieldSpec, input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    // Devolver el control a cero deja volver a elegir el mismo archivo después
    // de corregirlo; si no, el navegador no avisa de nuevo.
    input.value = '';
    return this.acceptIcon(row, field, file);
  }

  /** Lo mismo que elegirlo con el selector, pero soltándolo sobre el campo. */
  dropIcon(row: number, field: FieldSpec, event: DragEvent): Promise<void> {
    event.preventDefault();
    this.iconDropRow.set(null);
    return this.acceptIcon(row, field, event.dataTransfer?.files[0]);
  }

  /** Si se está arrastrando un archivo sobre el campo del icono de esa fila. */
  isIconDropTarget(row: number): boolean {
    return this.iconDropRow() === row;
  }

  /**
   * Habilita soltar sobre el campo. Sólo con archivos: arrastrar un texto
   * seleccionado no es subir un icono.
   */
  dragOverIcon(row: number, event: DragEvent): void {
    if (!carriesFiles(event)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.iconDropRow.set(row);
  }

  /**
   * Apaga el resaltado al salir del campo. Pasar por encima de la vista previa
   * o del botón también dispara `dragleave`, y eso no es haberse ido.
   */
  leaveIconDrop(event: DragEvent): void {
    const zone = event.currentTarget as HTMLElement | null;
    if (!zone?.contains(event.relatedTarget as Node | null)) {
      this.iconDropRow.set(null);
    }
  }

  /**
   * Un archivo soltado fuera de un campo hace que el navegador lo abra en la
   * pestaña, y eso se lleva puesto el borrador sin publicar. Fuera de los
   * campos, soltar no hace nada.
   */
  ignoreStrayDrop(event: DragEvent): void {
    if (event.defaultPrevented || !carriesFiles(event)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  private async acceptIcon(row: number, field: FieldSpec, file: File | undefined): Promise<void> {
    this.rejectedIcon.set(null);
    if (!file) {
      return;
    }

    // El peso se mira antes de leerlo: no tiene sentido cargar en memoria algo
    // que ya se sabe que no entra.
    if (file.size > ICON_MAX_BYTES) {
      this.rejectIcon(row, 'weight');
      return;
    }

    const source = await readAsDataUri(file);
    if (!source) {
      this.rejectIcon(row, 'unreadable');
      return;
    }

    const issue = iconIssue(source);
    if (issue) {
      this.rejectIcon(row, issue);
      return;
    }
    this.update(row, field, source);
  }

  clearIcon(row: number, field: FieldSpec): void {
    this.rejectedIcon.set(null);
    this.update(row, field, '');
  }

  /** El motivo por el que se rechazó el último archivo elegido en esa fila. */
  iconRejection(row: number): string | null {
    const rejected = this.rejectedIcon();
    return rejected?.row === row ? rejected.message : null;
  }

  private rejectIcon(row: number, issue: IconIssue): void {
    this.rejectedIcon.set({ row, message: explainIconIssue(issue) });
  }

  /**
   * Arregla al salir del campo lo que fue una omisión y no un error: escribir
   * el sitio sin el `https://` es lo que hace cualquiera, y el servidor lo
   * rechazaba entero por eso. Se hace al salir y no en cada tecla para no
   * pelearse con quien está escribiendo.
   */
  leaveField(index: number, field: FieldSpec, rawValue: string): void {
    const normalized = field.normalize?.(rawValue);
    if (normalized !== undefined && normalized !== rawValue) {
      this.update(index, field, normalized);
    }
  }

  add(): void {
    this.editSection((items) => [...items, this.spec().blank()]);
    // Sólo queda abierta la fila nueva: es la única que hay que completar, y la
    // lista se sigue leyendo de un vistazo en vez de crecer desplegada.
    this.expanded.set(new Set([this.items().length - 1]));
  }

  remove(index: number): void {
    this.editSection((items) => items.filter((_, position) => position !== index));
    this.expanded.set(new Set());
  }

  move(index: number, offset: number): void {
    this.editSection((items) => {
      const target = index + offset;
      if (target < 0 || target >= items.length) {
        return items;
      }
      const reordered = [...items];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((visible) => !visible);
  }

  async login(password: string): Promise<void> {
    this.loginError.set('');
    try {
      await firstValueFrom(this.session.login(password));
      this.isAuthenticated.set(true);
      await this.loadContent();
    } catch {
      this.loginError.set('No pudimos entrar con esa clave.');
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.session.logout());
    this.isAuthenticated.set(false);
    this.draft.set(null);
  }

  /** Publica la sección abierta. Lo que no pasa la validación del servidor no se guarda. */
  async save(): Promise<void> {
    const section = this.activeSection();
    const items = this.items();

    this.saveState.set('saving');
    this.saveError.set('');
    try {
      const saved = await firstValueFrom(
        this.editor.save(section, items as unknown as SiteContent[typeof section]),
      );
      this.editSection(() => saved as unknown as EditableItem[]);
      // El sitio y el panel son la misma aplicación: sin avisarle al repositorio,
      // volver al sitio sin recargar seguía mostrando lo de antes de publicar.
      this.content.refresh();
      this.saveState.set('saved');
      this.showIssues.set(false);
    } catch (error) {
      this.saveState.set('failed');
      this.saveError.set(this.explain(error));
      // El servidor dice que algo no pasa, no cuál: a partir de acá el panel
      // señala en rojo todo lo que él mismo sabe que va a hacerlo rechazar.
      this.showIssues.set(true);
    }
  }

  private parse(field: FieldSpec, rawValue: string): unknown {
    if (field.kind === 'number') {
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (field.kind === 'list') {
      // Un renglón por entregable: es como se leen y como se escriben.
      return rawValue.split('\n').map((entry) => entry.trim()).filter(Boolean);
    }
    return rawValue;
  }

  private editItem(index: number, change: (item: EditableItem) => EditableItem): void {
    this.editSection((items) =>
      items.map((item, position) => (position === index ? change(item) : item)),
    );
  }

  selectSection(section: ContentSection): void {
    this.activeSection.set(section);
    this.expanded.set(new Set());
    this.saveState.set('idle');
    this.showIssues.set(false);
  }

  private editSection(change: (items: EditableItem[]) => EditableItem[]): void {
    this.saveState.set('idle');
    this.draft.update((draft) => {
      if (!draft) {
        return draft;
      }
      const section = this.activeSection();
      return { ...draft, [section]: change(draft[section]) };
    });
  }

  private async restoreSession(): Promise<void> {
    try {
      const authenticated = await firstValueFrom(this.session.isAuthenticated());
      this.isAuthenticated.set(authenticated);
      if (authenticated) {
        await this.loadContent();
      }
    } finally {
      this.isChecking.set(false);
    }
  }

  private async loadContent(): Promise<void> {
    const content = await firstValueFrom(this.content.getContent());
    this.draft.set(structuredClone(content) as unknown as Draft);
  }

  /** Traduce el motivo del rechazo a algo accionable, sin filtrar detalles del servidor. */
  private explain(error: unknown): string {
    const response = error as { status?: number; error?: { error?: string } };
    // El límite de tamaño lo corta el servidor antes de leer el pedido: no
    // llega con código propio, sólo con el estado.
    if (response?.status === 413) {
      return 'La sección pesa demasiado para publicarla de una vez. Probá con íconos más livianos.';
    }
    switch (response?.error?.error) {
      case 'INVALID_ITEM':
        return 'Hay un campo vacío o fuera de rango. Revisá que estén completos los dos idiomas.';
      case 'DUPLICATE_ID':
        return 'Hay dos entradas con el mismo identificador.';
      case 'TOO_MANY_ITEMS':
        return 'La sección tiene más entradas de las permitidas.';
      case 'UNAUTHORIZED':
        return 'La sesión venció. Volvé a entrar.';
      case 'ADMIN_NOT_CONFIGURED':
        return 'El panel no tiene configuradas sus claves en el servidor.';
      case 'CONTENT_NOT_SAVED':
        return 'El servidor no pudo guardar el contenido. Revisá la configuración del almacenamiento.';
      default:
        return 'No se pudo guardar. Probá de nuevo.';
    }
  }
}
