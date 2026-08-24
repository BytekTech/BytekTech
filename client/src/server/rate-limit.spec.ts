import { SlidingWindowRateLimiter } from './rate-limit';

describe('SlidingWindowRateLimiter', () => {
  let now: number;
  const clock = () => now;

  beforeEach(() => {
    now = 1_000_000;
  });

  it('deja pasar hasta el máximo de intentos', () => {
    const limiter = new SlidingWindowRateLimiter(3, 1000, clock);

    expect([1, 2, 3].map(() => limiter.tryConsume('ip'))).toEqual([true, true, true]);
  });

  it('bloquea a partir del intento que excede el máximo', () => {
    const limiter = new SlidingWindowRateLimiter(2, 1000, clock);
    limiter.tryConsume('ip');
    limiter.tryConsume('ip');

    expect(limiter.tryConsume('ip')).toBeFalse();
  });

  it('vuelve a permitir cuando la ventana se corre', () => {
    const limiter = new SlidingWindowRateLimiter(1, 1000, clock);
    limiter.tryConsume('ip');
    expect(limiter.tryConsume('ip')).toBeFalse();

    now += 1001;

    expect(limiter.tryConsume('ip')).toBeTrue();
  });

  it('cuenta cada clave por separado', () => {
    const limiter = new SlidingWindowRateLimiter(1, 1000, clock);
    limiter.tryConsume('ip-a');

    expect(limiter.tryConsume('ip-b')).toBeTrue();
  });

  it('no permite que un bloqueo sostenido se extienda solo por seguir intentando', () => {
    const limiter = new SlidingWindowRateLimiter(1, 1000, clock);
    limiter.tryConsume('ip');

    now += 500;
    expect(limiter.tryConsume('ip')).toBeFalse();

    // El intento rechazado no debe contar como uno nuevo dentro de la ventana.
    now += 501;
    expect(limiter.tryConsume('ip')).toBeTrue();
  });
});
