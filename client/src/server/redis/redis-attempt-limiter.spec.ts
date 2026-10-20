import { RedisAttemptLimiter } from './redis-attempt-limiter';
import { RedisClient } from './redis.client';

const CONFIG = { url: 'https://redis.example.upstash.io', token: 'secreto' };

/** Un `fetch` falso que devuelve el conteo pedido y anota cada comando. */
function countingFetch(attempts: number) {
  return jasmine
    .createSpy('fetch')
    .and.callFake(async () => new Response(JSON.stringify({ result: attempts })));
}

function limiterOver(send: typeof fetch): RedisAttemptLimiter {
  return new RedisAttemptLimiter(new RedisClient(CONFIG, send), 'login-attempts', 5, 3_600_000);
}

describe('RedisAttemptLimiter', () => {
  it('deja pasar mientras el conteo compartido no supera el máximo', async () => {
    expect(await limiterOver(countingFetch(5)).tryConsume('203.0.113.7')).toBeTrue();
  });

  it('corta en cuanto el conteo compartido lo supera', async () => {
    expect(await limiterOver(countingFetch(6)).tryConsume('203.0.113.7')).toBeFalse();
  });

  it('cuenta por clave y con la ventana como vencimiento', async () => {
    const send = countingFetch(1);

    await limiterOver(send).tryConsume('203.0.113.7');

    const [, init] = send.calls.mostRecent().args as [string, RequestInit];
    const [command, , keys, key, windowMs] = JSON.parse(init.body as string) as string[];
    expect(command).toBe('EVAL');
    expect(keys).toBe('1');
    expect(key).toBe('bytek:login-attempts:203.0.113.7');
    expect(windowMs).toBe('3600000');
  });

  it('falla si Redis no responde, en vez de dejar pasar', async () => {
    const send = jasmine
      .createSpy('fetch')
      .and.callFake(async () => new Response(JSON.stringify({ error: 'ERR' }), { status: 500 }));

    await expectAsync(limiterOver(send).tryConsume('203.0.113.7')).toBeRejected();
  });
});
