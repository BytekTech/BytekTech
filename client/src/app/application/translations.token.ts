import { InjectionToken } from '@angular/core';
import { TranslationsDictionary } from './i18n/translations.contract';

// El diccionario concreto se provee en la composition root (app.config.ts),
// así esta capa no depende de la capa de datos.
export const APP_TRANSLATIONS = new InjectionToken<TranslationsDictionary>('APP_TRANSLATIONS');
