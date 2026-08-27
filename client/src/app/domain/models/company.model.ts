export interface SocialLink {
  /** Nombre visible de la red; también se usa como clave de listado. */
  name: string;
  url: string;
}

export interface Company {
  name: string;
  /** Origen canónico del sitio, sin barra final. Base de canonical, hreflang y JSON-LD. */
  siteUrl: string;
  legalName: string;
  email: string;
  /** Teléfono tal como se lee, con espacios y guiones. */
  phone: string;
  location: string;
  foundedYear: number;
  social: SocialLink[];
}
