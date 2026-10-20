import { RedisClient } from '../redis/redis.client';
import { RedisSessionRevocations } from '../redis/redis-session-revocations';
import { InMemorySessionRevocations, tokenFingerprint } from './session-revocations';

const CONFIG = { url: 'https://redis.example.upstash.io', token: 'secreto' };
const TOKEN = '1700000000000.firma';

describe('tokenFingerprint', () => {
  it('es estable y no contiene el token', async () => {
    const fingerprint = await tokenFingerprint(TOKEN);

    expect(await tokenFingerprint(TOKEN)).toBe(fingerprint);
    expect(fingerprint).not.toContain('firma');
  });
});

describe('InMemorySessionRevocations', () => {
  let now: number;
  const clock = () => now;

  beforeEach(() => {
    now = 1_000;
  });

  it('una sesión cerrada queda revocada hasta su vencimiento', async () => {
    const revocations = new InMemorySessionRevocations(clock);

    await revocations.revoke(TOKEN, 5_000);

    expect(await revocations.isRevoked(TOKEN)).toBeTrue();
    expect(await revocations.isRevoked('otro.token')).toBeFalse();
  });

  it('pasado el vencimiento la revocación ya no cuenta', async () => {
    const revocations = new InMemorySessionRevocations(clock);
    await revocations.revoke(TOKEN, 5_000);

    now = 5_000;

    expect(await revocations.isRevoked(TOKEN)).toBeFalse();
  });
});

describe('RedisSessionRevocations', () => {
  function redisAnswering(result: unknown) {
    return jasmine
      .createSpy('fetch')
      .and.callFake(async () => new Response(JSON.stringify({ result })));
  }

  function sentCommand(send: jasmine.Spy): string[] {
    const [, init] = send.calls.mostRecent().args as [string, RequestInit];
    return JSON.parse(init.body as string) as string[];
  }

  it('guarda la huella, nunca el token, y la hace vencer con la sesión', async () => {
    const send = redisAnswering('OK');
    const revocations = new RedisSessionRevocations(new RedisClient(CONFIG, send), () => 1_000);

    await revocations.revoke(TOKEN, 5_000);

    const [command, key, , px, ttl] = sentCommand(send);
    expect(command).toBe('SET');
    expect(key).toBe(`bytek:revoked-session:${await tokenFingerprint(TOKEN)}`);
    expect(key).not.toContain(TOKEN);
    expect([px, ttl]).toEqual(['PX', '4000']);
  });

  it('no anota una sesión que ya venció', async () => {
    const send = redisAnswering('OK');
    const revocations = new RedisSessionRevocations(new RedisClient(CONFIG, send), () => 9_000);

    await revocations.revoke(TOKEN, 5_000);

    expect(send).not.toHaveBeenCalled();
  });

  it('reconoce una sesión revocada', async () => {
    const revocations = new RedisSessionRevocations(new RedisClient(CONFIG, redisAnswering(1)));

    expect(await revocations.isRevoked(TOKEN)).toBeTrue();
  });

  it('una sesión sin revocar sigue en pie', async () => {
    const revocations = new RedisSessionRevocations(new RedisClient(CONFIG, redisAnswering(0)));

    expect(await revocations.isRevoked(TOKEN)).toBeFalse();
  });
});
