/**
 * El `tel:` que entiende el teléfono. El número se guarda tal como se lee
 * —con espacios y guiones— y el esquema no los admite, así que se conservan
 * sólo los dígitos y el prefijo internacional.
 */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
