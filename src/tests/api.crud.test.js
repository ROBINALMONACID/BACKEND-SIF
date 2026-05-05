import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';

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

test('inactive user cannot log in', async () => {
  const { default: Usuario } = await import('../models/usuario.model.js');

  const inactivePassword = 'Inactive123!';
  const passwordHash = await bcrypt.hash(inactivePassword, 10);

  await Usuario.upsert({
    id_usuario: 'inactive_user_test',
    correo_electronico: 'inactive.user@local.test',
    contraseña: passwordHash,
    activado: false,
    idioma: 'es'
  });

  const res = await api('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'inactive.user@local.test',
      password: inactivePassword
    })
  });

  assert.equal(res.status, 403);
  assert.equal(
    res.json?.error?.message,
    'Tu cuenta esta inactiva. Contacta a un administrador.'
  );
});

test('cannot delete current authenticated user', async () => {
  const deleteSelfRes = await api('/api/v1/user/test_admin', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(deleteSelfRes.status, 403);
  assert.equal(
    deleteSelfRes.json?.error?.message,
    'No puedes eliminar la cuenta con la que tienes la sesion activa'
  );
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

  const { default: Rol } = await import('../models/rol.model.js');
  const [sellerRole] = await Rol.findOrCreate({
    where: { nombre_rol: 'Vendedor' },
    defaults: { nombre_rol: 'Vendedor' }
  });

  const updateRoleRes = await api(`/api/v1/user/${userId}/role`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      correo_electronico: email,
      idioma: 'en',
      activado: true,
      id_rol: sellerRole.id_rol
    })
  });
  assert.equal(updateRoleRes.status, 200);

  const getWithRoleRes = await api(`/api/v1/user/${userId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(getWithRoleRes.status, 200);
  assert.equal(getWithRoleRes.json?.id_rol, sellerRole.id_rol);

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
