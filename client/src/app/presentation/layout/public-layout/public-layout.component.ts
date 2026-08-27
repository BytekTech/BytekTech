import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from '../../../application/language.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ChatbotComponent } from '../../widgets/chatbot/chatbot.component';

/**
 * El marco del sitio público: barra, pie y chat alrededor de la página que
 * toque. El panel de administración cuelga fuera de este layout, así que entra
 * limpio, sin nada de la cáscara del sitio.
 */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatbotComponent],
  templateUrl: './public-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  readonly t = inject(LanguageService).t;
}
