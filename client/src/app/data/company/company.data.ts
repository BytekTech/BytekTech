import { Company } from '../../domain/models/company.model';

// ─────────────────────────────────────────────────────────────────────────────
// [COMPLETAR] Confirmar la ubicación, el año de fundación y los perfiles reales
// antes de publicar. El correo y el teléfono de contacto ya están confirmados.
// ─────────────────────────────────────────────────────────────────────────────
export const COMPANY: Company = {
  name: 'Bytek Technology',
  siteUrl: 'https://bytektechnology.com',
  legalName: 'Bytek Technology',
  email: 'bytektechnology@gmail.com',
  phone: '+54 11 5963-8765',
  location: 'Buenos Aires, Argentina',
  foundedYear: 2020,
  social: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/bytek-technology' },
    { name: 'Instagram', url: 'https://www.instagram.com/bytek_ar' },
  ],
};
