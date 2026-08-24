export interface ContactPayload {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
  /** Trampa para bots: un humano nunca la completa (ver contact.component.html). */
  website?: unknown;
}

export interface ContactFields {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export type ContactValidationError = 'INVALID_FIELDS' | 'INVALID_EMAIL' | 'FIELD_TOO_LONG';

export type ValidationResult =
  | { ok: true; fields: ContactFields }
  | { ok: false; error: ContactValidationError };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_LENGTHS = {
  name: 120,
  email: 200,
  company: 160,
  message: 4000,
} as const;

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Un envío con la trampa completada sólo puede venir de un bot. */
export function isHoneypotTripped(payload: ContactPayload | undefined): boolean {
  return isNonEmptyString(payload?.website);
}

export function validatePayload(payload: ContactPayload): ValidationResult {
  const { name, email, company, message } = payload;

  if (!isNonEmptyString(name) || !isNonEmptyString(message)) {
    return { ok: false, error: 'INVALID_FIELDS' };
  }
  if (!isNonEmptyString(email) || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'INVALID_EMAIL' };
  }

  const normalizedCompany = isNonEmptyString(company) ? company : undefined;

  // Un mensaje desmedido no aporta nada legítimo y sí infla el correo saliente.
  if (
    name.length > MAX_LENGTHS.name ||
    email.length > MAX_LENGTHS.email ||
    message.length > MAX_LENGTHS.message ||
    (normalizedCompany?.length ?? 0) > MAX_LENGTHS.company
  ) {
    return { ok: false, error: 'FIELD_TOO_LONG' };
  }

  return { ok: true, fields: { name, email, message, company: normalizedCompany } };
}

// Escape seguro para contenido de texto y atributos HTML (escapa también comillas).
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
