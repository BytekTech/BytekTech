import {
  buildContentSecurityPolicy,
  createNonce,
  CRITICAL_CSS_LOADER,
  executableInlineScripts,
  inlineScriptSources,
  scriptHashSource,
  trustedScriptHashes,
} from './content-security-policy';

const TEMPLATE = `<!doctype html><html><head>
<script>aplicarTema();</script>
<script type="text/javascript" id="contrato">registrarEventos();</script>
<script type="application/ld+json">{"@context":"https://schema.org"}</script>
<script src="main.js" type="module"></script>
</head><body><app-root></app-root></body></html>`;

describe('executableInlineScripts', () => {
  it('toma sólo los scripts en línea que el navegador ejecutaría', () => {
    expect(executableInlineScripts(TEMPLATE)).toEqual(['aplicarTema();', 'registrarEventos();']);
  });

  it('deja afuera los bloques de datos y los scripts con src', () => {
    const html = '<script id="ng-state" type="application/json">{}</script><script src="a.js"></script>';

    expect(executableInlineScripts(html)).toEqual([]);
  });
});

describe('scriptHashSource', () => {
  it('calcula el sha256 en base64 del texto exacto', async () => {
    // Valor de referencia: printf 'alert(1)' | openssl dgst -sha256 -binary | base64
    expect(await scriptHashSource('alert(1)')).toBe("'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='");
  });
});

describe('trustedScriptHashes', () => {
  it('avala los scripts del template y el cargador de CSS crítico', async () => {
    const hashes = await trustedScriptHashes(TEMPLATE);

    expect(hashes).toEqual([
      await scriptHashSource('aplicarTema();'),
      await scriptHashSource('registrarEventos();'),
      await scriptHashSource(CRITICAL_CSS_LOADER),
    ]);
  });

  it('sin template avala sólo el cargador de CSS crítico', async () => {
    expect(await trustedScriptHashes('')).toEqual([await scriptHashSource(CRITICAL_CSS_LOADER)]);
  });
});

describe('createNonce', () => {
  it('no repite el nonce entre pedidos', () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});

describe('inlineScriptSources', () => {
  it('con hashes avala el nonce del pedido y los scripts fijos', () => {
    expect(inlineScriptSources('abc', ["'sha256-xyz'"])).toEqual(["'nonce-abc'", "'sha256-xyz'"]);
  });

  it('sin hashes del template vuelve a admitir scripts en línea, sin nonce que lo anule', () => {
    expect(inlineScriptSources('abc', null)).toEqual(["'unsafe-inline'"]);
  });
});

describe('buildContentSecurityPolicy', () => {
  const policy = buildContentSecurityPolicy(inlineScriptSources('abc', ["'sha256-xyz'"]));
  const scriptSrc = policy.split('; ').find((directive) => directive.startsWith('script-src'));

  it('admite scripts sólo del sitio, con el nonce o con un hash avalado', () => {
    expect(scriptSrc).toBe("script-src 'self' 'nonce-abc' 'sha256-xyz'");
  });

  it('no admite scripts en línea sin avalar', () => {
    expect(scriptSrc).not.toContain('unsafe-inline');
  });

  it('mantiene los cerrojos contra marcos y objetos embebidos', () => {
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });
});
