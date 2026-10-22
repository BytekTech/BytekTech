import { Company } from '../../domain/models/company.model';

// ─────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Confirmar la ubicación y los perfiles reales antes de publicar.
// El correo, el teléfono y el año de fundación ya están confirmados.
// ─────────────────────────────────────────────────────────────────────────────
export const COMPANY: Company = {
  name: 'Bytek Technology',
  siteUrl: 'https://bytektechnology.com',
  legalName: 'Bytek Technology',
  email: 'bytektechnology@gmail.com',
  phone: '+54 11 5963-8765',
  location: 'Buenos Aires, Argentina',
  foundedYear: 2023,
  social: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/bytek-technology' },
    { name: 'Instagram', url: 'https://www.instagram.com/bytek_ar' },
  ],
};
