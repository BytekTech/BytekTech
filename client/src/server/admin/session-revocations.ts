/**
 * Sesiones cerradas antes de vencer.
 *
 * El token firmado sigue siendo válido hasta su vencimiento aunque se borre la
 * cookie: si alguien lo copió, salir del panel no lo dejaría afuera. Por eso
 * cerrar sesión lo anota acá hasta que venza solo, y cada pedido del panel
 * pregunta antes de dejar pasar.
 */
export interface SessionRevocations {
  revoke(token: string, deadline: number): Promise<void>;
  isRevoked(token: string): Promise<boolean>;
}

/**
 * Huella del token: se guarda la huella, nunca el token, que abriría el panel.
 * Con Web Crypto y no con `node:crypto`, para que corra igual en los tests.
 */
export async function tokenFingerprint(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Para un servidor de una sola instancia (desarrollo, disco propio). La lista
 * vive en el proceso y se pierde al reiniciarlo; con varias instancias va Redis.
 */
export class InMemorySessionRevocations implements SessionRevocations {
  private readonly revoked = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  async revoke(token: string, deadline: number): Promise<void> {
    this.evictExpired();
    this.revoked.set(await tokenFingerprint(token), deadline);
  }

  async isRevoked(token: string): Promise<boolean> {
    const deadline = this.revoked.get(await tokenFingerprint(token));
    return deadline !== undefined && deadline > this.now();
  }

  /** Una revocación vencida ya no protege nada: el token tampoco vale. */
  private evictExpired(): void {
    const now = this.now();
    for (const [fingerprint, deadline] of this.revoked) {
      if (deadline <= now) {
        this.revoked.delete(fingerprint);
      }
    }
  }
}
