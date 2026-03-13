import test from 'node:test';
import assert from 'node:assert/strict';

import { startTestServer, stopTestServer, getBaseUrl, ensureAdminUser } from './testUtils.js';

async function api(path, options = {}) {
  const baseUrl = getBaseUrl();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(`${baseUrl}${path}`, {
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

test('health endpoint', async () => {
  const res = await api('/health');
  assert.equal(res.status, 200);
  assert.equal(res.json?.status, 'OK');
});

test('login and get token', async () => {
  const creds = await ensureAdminUser();
  const res = await api('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: creds.email, password: creds.password })
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.token, 'token missing in response');
  token = res.json.token;
});

test('users list (admin)', async () => {
  const res = await api('/api/v1/user', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json?.data));
});

test('products list', async () => {
  const res = await api('/api/v1/product', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.data !== undefined);
});

test('categories list', async () => {
  const res = await api('/api/v1/categoria', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json));
});

test('clients list', async () => {
  const res = await api('/api/v1/client', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.data !== undefined);
});

test('receipts list', async () => {
  const res = await api('/api/v1/recibo-caja', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json));
});

test('closures list', async () => {
  const res = await api('/api/v1/cierre-caja', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.ok(res.json?.data !== undefined);
});

test('teardown server', async () => {
  await stopTestServer();
});
