import { redisConfig } from './redis.client';

const URL = 'https://redis.example.upstash.io';

describe('redisConfig', () => {
  it('toma los nombres que carga la integración de Vercel', () => {
    expect(redisConfig({ KV_REST_API_URL: URL, KV_REST_API_TOKEN: 't' })).toEqual({
      url: URL,
      token: 't',
    });
  });

  it('toma los nombres de la consola de Upstash', () => {
    expect(
      redisConfig({ UPSTASH_REDIS_REST_URL: URL, UPSTASH_REDIS_REST_TOKEN: 't' }),
    ).toEqual({ url: URL, token: 't' });
  });

  it('no arma nada si falta alguna de las dos', () => {
    expect(redisConfig({ KV_REST_API_URL: URL })).toBeNull();
    expect(redisConfig({})).toBeNull();
  });

  it('rechaza una URL sin HTTPS: el token viajaría en claro', () => {
    expect(redisConfig({ KV_REST_API_URL: 'http://redis.local', KV_REST_API_TOKEN: 't' })).toBeNull();
  });
});
