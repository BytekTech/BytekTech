import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../../application/theme.service';

/**
 * Botón que alterna entre tema claro y oscuro. Los textos llegan de afuera
 * porque el sitio los traduce y el panel no: el botón es el mismo en los dos.
 */
@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly toLightLabel = input.required<string>();
  readonly toDarkLabel = input.required<string>();

  readonly theme = this.themeService.theme;

  /** El botón anuncia adónde lleva, no dónde está: es una acción, no un estado. */
  readonly actionLabel = computed(() =>
    this.theme() === 'dark' ? this.toLightLabel() : this.toDarkLabel(),
  );

  toggle(): void {
    this.themeService.toggle();
  }
}
