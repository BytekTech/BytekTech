import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './application/language.service';
import { SeoService } from './application/seo.service';
import { HeaderComponent } from './presentation/layout/header/header.component';
import { FooterComponent } from './presentation/layout/footer/footer.component';
import { ChatbotComponent } from './presentation/widgets/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly t = inject(LanguageService).t;

  constructor() {
    // Basta con instanciarlo: mantiene la metadata al día por sí mismo.
    inject(SeoService);
  }
}
