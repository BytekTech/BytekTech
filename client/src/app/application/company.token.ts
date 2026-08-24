import { InjectionToken } from '@angular/core';
import { Company } from '../domain/models/company.model';

// Los datos de la empresa se proveen desde la composition root, igual que el
// diccionario de traducciones: la presentación los consume sin conocer su origen.
export const COMPANY_INFO = new InjectionToken<Company>('COMPANY_INFO');
