import { AttemptLimiter } from '../rate-limit';
import { RedisClient } from './redis.client';

/**
 * Suma el intento y, si es el primero de la ventana, le pone vencimiento. Va en
 * un script para que las dos cosas pasen juntas: un contador sin vencimiento
 * dejaría a esa IP bloqueada para siempre.
 */
const COUNT_ATTEMPT_SCRIPT = `
local attempts = redis.call('INCR', KEYS[1])
if attempts == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return attempts`;

/**
 * Límite de intentos compartido por todas las instancias, con ventana fija.
 *
 * En serverless cada instancia tiene su propia memoria: un contador local se
 * reparte entre ellas y un ataque distribuido no lo llena nunca. Contado en
 * Redis, el tope es el mismo para todas.
 */
export class RedisAttemptLimiter implements AttemptLimiter {
  constructor(
    private readonly redis: RedisClient,
    private readonly scope: string,
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  async tryConsume(key: string): Promise<boolean> {
    const attempts = await this.redis.command<number>([
      'EVAL',
      COUNT_ATTEMPT_SCRIPT,
      '1',
      `bytek:${this.scope}:${key}`,
      String(this.windowMs),
    ]);
    return attempts <= this.maxAttempts;
  }
}
