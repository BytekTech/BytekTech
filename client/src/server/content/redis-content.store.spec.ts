import { seedContent } from '../../app/data/content/seed-content';
import { CONTENT_KEY, redisConfig, RedisContentStore } from './redis-content.store';

const CONFIG = { url: 'https://redis.example.upstash.io', token: 'secreto' };

/** Un `fetch` falso que responde siempre lo mismo y anota qué se le pidió. */
function fakeFetch(body: unknown, status = 200) {
  return jasmine
    .createSpy('fetch')
    .and.callFake(async () => new Response(JSON.stringify(body), { status }));
}

function sentCommand(spy: jasmine.Spy): unknown {
  const [, init] = spy.calls.mostRecent().args as [string, RequestInit];
  return JSON.parse(init.body as string);
}

describe('RedisContentStore', () => {
  it('sirve el contenido de fábrica cuando todavía no se publicó nada', async () => {
    const store = new RedisContentStore(CONFIG, fakeFetch({ result: null }));

    expect(await store.read()).toEqual(seedContent());
  });

  it('devuelve lo guardado', async () => {
    const published = seedContent();
    published.clients = [];
    const store = new RedisContentStore(CONFIG, fakeFetch({ result: JSON.stringify(published) }));

    expect((await store.read()).clients).toEqual([]);
  });

  it('sirve el contenido de fábrica si lo guardado no pasa la validación', async () => {
    spyOn(console, 'error');
    const store = new RedisContentStore(CONFIG, fakeFetch({ result: '{"clients":"roto"}' }));

    expect(await store.read()).toEqual(seedContent());
  });

  it('falla si Redis no responde, en vez de servir el contenido de fábrica', async () => {
    const store = new RedisContentStore(CONFIG, fakeFetch({ error: 'WRONGPASS' }, 401));

    await expectAsync(store.read()).toBeRejected();
  });

  it('guarda todo el contenido en una sola clave, con el token', async () => {
    const send = fakeFetch({ result: 'OK' });
    const store = new RedisContentStore(CONFIG, send);
    const content = seedContent();

    await store.write(content);

    const [url, init] = send.calls.mostRecent().args as [string, RequestInit];
    expect(url).toBe(CONFIG.url);
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer secreto');
    expect(sentCommand(send)).toEqual(['SET', CONTENT_KEY, JSON.stringify(content)]);
  });

  it('falla al guardar si Redis rechaza el comando', async () => {
    const store = new RedisContentStore(CONFIG, fakeFetch({ error: 'OOM' }, 400));

    await expectAsync(store.write(seedContent())).toBeRejected();
  });
});

describe('redisConfig', () => {
  it('toma los nombres que carga la integración de Vercel', () => {
    expect(redisConfig({ KV_REST_API_URL: CONFIG.url, KV_REST_API_TOKEN: 't' })).toEqual({
      url: CONFIG.url,
      token: 't',
    });
  });

  it('toma los nombres de la consola de Upstash', () => {
    expect(
      redisConfig({ UPSTASH_REDIS_REST_URL: CONFIG.url, UPSTASH_REDIS_REST_TOKEN: 't' }),
    ).toEqual({ url: CONFIG.url, token: 't' });
  });

  it('no arma nada si falta alguna de las dos', () => {
    expect(redisConfig({ KV_REST_API_URL: CONFIG.url })).toBeNull();
    expect(redisConfig({})).toBeNull();
  });

  it('rechaza una URL sin HTTPS: el token viajaría en claro', () => {
    expect(redisConfig({ KV_REST_API_URL: 'http://redis.local', KV_REST_API_TOKEN: 't' })).toBeNull();
  });
});
