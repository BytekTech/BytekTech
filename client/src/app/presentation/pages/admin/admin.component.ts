import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Lang, SUPPORTED_LANGS } from '../../../domain/models/language.model';
import { ContentSection, SiteContent } from '../../../domain/models/site-content.model';
import { ContentRepository } from '../../../domain/repositories/content.repository';
import { AdminSessionGateway } from '../../../domain/gateways/admin-session.gateway';
import { ContentEditorGateway } from '../../../domain/gateways/content-editor.gateway';
import { EditableItem, FieldSpec, SECTION_SPECS, specFor } from './content-fields';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

/** Borrador de trabajo: el contenido tal como se está editando, aún sin publicar. */
type Draft = Record<ContentSection, EditableItem[]>;

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  private readonly session = inject(AdminSessionGateway);
  private readonly editor = inject(ContentEditorGateway);
  private readonly content = inject(ContentRepository);
  private readonly meta = inject(Meta);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly langs = SUPPORTED_LANGS;
  readonly specs = SECTION_SPECS;

  readonly isAuthenticated = signal(false);
  readonly isChecking = signal(true);
  readonly loginError = signal('');

  readonly activeSection = signal<ContentSection>('clients');
  readonly activeLang = signal<Lang>('es');
  readonly saveState = signal<SaveState>('idle');
  readonly saveError = signal('');

  private readonly draft = signal<Draft | null>(null);
  /**
   * Qué filas están abiertas: la lista se lee de un vistazo y se edita de a una.
   * Se sigue por posición y no por id, porque el id es justamente uno de los
   * campos que se pueden estar editando.
   */
  private readonly expanded = signal<ReadonlySet<number>>(new Set());

  readonly spec = computed(() => specFor(this.activeSection()));
  readonly items = computed(() => this.draft()?.[this.activeSection()] ?? []);

  constructor() {
    // El panel no es contenido del sitio: no tiene por qué aparecer en un buscador.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
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

  add(): void {
    this.editSection((items) => [...items, this.spec().blank()]);
    this.toggle(this.items().length - 1);
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
      this.saveState.set('saved');
    } catch (error) {
      this.saveState.set('failed');
      this.saveError.set(this.explain(error));
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
    const code = (error as { error?: { error?: string } })?.error?.error;
    switch (code) {
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
      default:
        return 'No se pudo guardar. Probá de nuevo.';
    }
  }
}
