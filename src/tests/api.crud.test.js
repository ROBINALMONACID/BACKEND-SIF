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

test('users CRUD', async () => {
  const email = `test.user.${Date.now()}@local.test`;

  const createRes = await api('/api/v1/user', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      correo_electronico: email,
      password: 'Test1234!',
      idioma: 'es',
      activado: true
    })
  });
  assert.equal(createRes.status, 201);
  const userId = createRes.json?.id_usuario;
  assert.ok(userId, 'user id missing');

  const getRes = await api(`/api/v1/user/${userId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(getRes.status, 200);

  const updateRes = await api(`/api/v1/user/${userId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ idioma: 'en' })
  });
  assert.equal(updateRes.status, 200);

  const deleteRes = await api(`/api/v1/user/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(deleteRes.status, 200);
});

test('products CRUD', async () => {
  const categoryName = `Cat ${Date.now()}`;
  const createCat = await api('/api/v1/categoria', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre_categoria: categoryName })
  });
  assert.equal(createCat.status, 201);
  const categoryId = createCat.json?.id_categoria;
  assert.ok(categoryId, 'category id missing');

  const sku = `SKU-T-${Date.now()}`;
  const createProd = await api('/api/v1/product', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      codigo_sku: sku,
      nombre_producto: 'Producto Test',
      id_categoria: categoryId,
      stock: 5,
      precio_unitario: 1000
    })
  });
  assert.equal(createProd.status, 201);
  const productId = createProd.json?.id_producto;
  assert.ok(productId, 'product id missing');

  const updateProd = await api(`/api/v1/product/${productId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      codigo_sku: sku,
      nombre_producto: 'Producto Test Editado',
      stock: 6,
      precio_unitario: 1200,
      id_categoria: categoryId,
      estado: 'activo'
    })
  });
  assert.equal(updateProd.status, 200);

  const deleteProd = await api(`/api/v1/product/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(deleteProd.status, 200);
});

test('teardown server', async () => {
  await stopTestServer();
});
