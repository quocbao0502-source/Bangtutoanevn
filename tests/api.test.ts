import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server';

test('API health and invalid requests return JSON without calling Gemini', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${base}/api/health`).then(r => r.json());
    assert.equal(health.status, 'ok');
    for (const body of [{}, { imageBase64: 5 }, { imageBase64: 'not valid base64!' }, { imageBase64: 'AAAA', mimeType: 'image/svg+xml' }]) {
      const response = await fetch(`${base}/api/analyze-pole`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error, 'string');
    }
    const invalid = await fetch(`${base}/api/analyze-pole`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(invalid.status, 400);
    assert.match(invalid.headers.get('content-type')!, /json/);
    const unknown = await fetch(`${base}/api/missing`);
    assert.equal(unknown.status, 404);
    if (!health.geminiConfigured) {
      const unconfigured = await fetch(`${base}/api/analyze-pole`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: 'AAAA', mimeType: 'image/png' }) });
      assert.equal(unconfigured.status, 503);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
