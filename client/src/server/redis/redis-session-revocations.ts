import { SessionRevocations, tokenFingerprint } from '../admin/session-revocations';
import { RedisClient } from './redis.client';

const REVOKED_PREFIX = 'bytek:revoked-session:';

/**
 * Revocaciones compartidas por todas las instancias. Cada una vence junto con
 * su token, así que la lista no crece: sólo guarda lo que todavía podría usarse.
 */
export class RedisSessionRevocations implements SessionRevocations {
  constructor(
    private readonly redis: RedisClient,
    private readonly now: () => number = Date.now,
  ) {}

  async revoke(token: string, deadline: number): Promise<void> {
    const remainingMs = deadline - this.now();
    if (remainingMs <= 0) {
      return;
    }
    await this.redis.command(['SET', await this.keyFor(token), '1', 'PX', String(remainingMs)]);
  }

  async isRevoked(token: string): Promise<boolean> {
    return (await this.redis.command<number>(['EXISTS', await this.keyFor(token)])) === 1;
  }

  private async keyFor(token: string): Promise<string> {
    return REVOKED_PREFIX + (await tokenFingerprint(token));
  }
}
