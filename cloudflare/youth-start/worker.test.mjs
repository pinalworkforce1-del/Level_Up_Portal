import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { mapUpstreamPath } from './worker.mjs';

test('proxy maps public routes to the current Level Up GitHub Pages build', () => {
  assert.equal(mapUpstreamPath('/'), '/Level_Up_Portal/');
  assert.equal(mapUpstreamPath('/career-tree-next/'), '/Level_Up_Portal/career-tree-next/');
  assert.equal(mapUpstreamPath('/Level_Up_Portal/assets/app.js'), '/Level_Up_Portal/assets/app.js');
  assert.equal(mapUpstreamPath('/Level_Up_Portal/'), '/Level_Up_Portal/');
});

test('proxied requests do not forward user authentication material to GitHub', async () => {
  const originalFetch = globalThis.fetch;
  const originalRewriter = globalThis.HTMLRewriter;
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, headers: init.headers };
    return new Response('ok', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  };
  try {
    const response = await worker.fetch(new Request('https://start.levelupcareers.org/career-tree-next/', {
      headers: {
        cookie: 'session=secret',
        authorization: 'Bearer secret',
        accept: 'text/plain',
        'x-test': 'sensitive',
      },
    }));
    assert.equal(response.status, 200);
    assert.equal(seen.url, 'https://pinalworkforce1-del.github.io/Level_Up_Portal/career-tree-next/');
    assert.equal(seen.headers.get('accept'), 'text/plain');
    assert.equal(seen.headers.get('authorization'), null);
    assert.equal(seen.headers.get('cookie'), null);
    assert.equal(seen.headers.get('x-test'), null);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.HTMLRewriter = originalRewriter;
  }
});

test('worker rewrites upstream canonical redirects to the branded subdomain', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, {
    status: 301,
    headers: { Location: 'https://pinalworkforce1-del.github.io/Level_Up_Portal/career-tree-next/' },
  });
  try {
    const response = await worker.fetch(new Request('https://start.levelupcareers.org/career-tree-next'));
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://start.levelupcareers.org/career-tree-next/');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('mutating requests are rejected before contacting GitHub', async () => {
  const response = await worker.fetch(new Request('https://start.levelupcareers.org/', { method: 'POST' }));
  assert.equal(response.status, 405);
});
