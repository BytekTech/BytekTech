/**
 * Límite de peticiones por clave con ventana deslizante, en memoria del proceso.
 *
 * En un entorno serverless las instancias se reciclan y conviven varias a la
 * vez, así que esto no es una garantía dura: es una barrera barata que corta
 * el abuso trivial (un script disparando el formulario en bucle) sin agregar
 * infraestructura. Un atacante distribuido necesita otra defensa.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxHits: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Registra un intento y devuelve si la clave todavía está dentro del límite. */
  tryConsume(key: string): boolean {
    const now = this.now();
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);

    if (recent.length >= this.maxHits) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.evictExpired(now);
    return true;
  }

  /** Evita que el mapa crezca sin techo con claves que ya no cuentan. */
  private evictExpired(now: number): void {
    for (const [key, timestamps] of this.hits) {
      if (timestamps.every((at) => now - at >= this.windowMs)) {
        this.hits.delete(key);
      }
    }
  }
}
