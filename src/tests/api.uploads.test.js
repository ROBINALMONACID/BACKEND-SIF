import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { startTestServer, stopTestServer, getBaseUrl, ensureAdminUser } from './testUtils.js';

async function api(pathname, options = {}) {
  const baseUrl = getBaseUrl();
  const headers = {
    ...(options.headers || {})
  };
  const res = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

let token;

test('setup server', async () => {
  await startTestServer();
});

test('login and get token', async () => {
  const creds = await ensureAdminUser();
  const res = await api('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password })
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.token, 'token missing in response');
  token = res.json.token;
});

test('upload product image', async () => {
  const form = new FormData();
  const pngBytes = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,12,73,68,65,84,8,215,99,248,15,0,1,1,1,0,24,221,141,188,0,0,0,0,73,69,78,68,174,66,96,130]);
  const blob = new Blob([pngBytes], { type: 'image/png' });
  form.append('image', blob, 'test.png');

  const res = await api('/api/v1/upload/product', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.url?.includes('/uploads/products/'));
  if (res.json?.filename) {
    const filePath = path.join(process.cwd(), 'uploads', 'products', res.json.filename);
    await fs.unlink(filePath);
  }
});

test('upload client image', async () => {
  const form = new FormData();
  const pngBytes = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,12,73,68,65,84,8,215,99,248,15,0,1,1,1,0,24,221,141,188,0,0,0,0,73,69,78,68,174,66,96,130]);
  const blob = new Blob([pngBytes], { type: 'image/png' });
  form.append('image', blob, 'test.png');

  const res = await api('/api/v1/upload/client', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.url?.includes('/uploads/clients/'));
  if (res.json?.filename) {
    const filePath = path.join(process.cwd(), 'uploads', 'clients', res.json.filename);
    await fs.unlink(filePath);
  }
});

test('teardown server', async () => {
  await stopTestServer();
});
