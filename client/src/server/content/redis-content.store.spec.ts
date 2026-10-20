import { seedContent } from '../../app/data/content/seed-content';
import { RedisClient } from '../redis/redis.client';
import { CONTENT_KEY, RedisContentStore } from './redis-content.store';

const CONFIG = { url: 'https://redis.example.upstash.io', token: 'secreto' };

/** Un `fetch` falso que responde siempre lo mismo y anota qué se le pidió. */
function fakeFetch(body: unknown, status = 200) {
  return jasmine
    .createSpy('fetch')
    .and.callFake(async () => new Response(JSON.stringify(body), { status }));
}

function storeOver(send: typeof fetch): RedisContentStore {
  return new RedisContentStore(new RedisClient(CONFIG, send));
}

function sentCommand(spy: jasmine.Spy): unknown {
  const [, init] = spy.calls.mostRecent().args as [string, RequestInit];
  return JSON.parse(init.body as string);
}

describe('RedisContentStore', () => {
  it('sirve el contenido de fábrica cuando todavía no se publicó nada', async () => {
    const store = storeOver(fakeFetch({ result: null }));

    expect(await store.read()).toEqual(seedContent());
  });

  it('devuelve lo guardado', async () => {
    const published = seedContent();
    published.clients = [];
    const store = storeOver(fakeFetch({ result: JSON.stringify(published) }));

    expect((await store.read()).clients).toEqual([]);
  });

  it('sirve el contenido de fábrica si lo guardado no pasa la validación', async () => {
    spyOn(console, 'error');
    const store = storeOver(fakeFetch({ result: '{"clients":"roto"}' }));

    expect(await store.read()).toEqual(seedContent());
  });

  it('falla si Redis no responde, en vez de servir el contenido de fábrica', async () => {
    const store = storeOver(fakeFetch({ error: 'WRONGPASS' }, 401));

    await expectAsync(store.read()).toBeRejected();
  });

  it('guarda todo el contenido en una sola clave, con el token', async () => {
    const send = fakeFetch({ result: 'OK' });
    const store = storeOver(send);
    const content = seedContent();

    await store.write(content);

    const [url, init] = send.calls.mostRecent().args as [string, RequestInit];
    expect(url).toBe(CONFIG.url);
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer secreto');
    expect(sentCommand(send)).toEqual(['SET', CONTENT_KEY, JSON.stringify(content)]);
  });

  it('falla al guardar si Redis rechaza el comando', async () => {
    const store = storeOver(fakeFetch({ error: 'OOM' }, 400));

    await expectAsync(store.write(seedContent())).toBeRejected();
  });
});
