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

async function ensureTipoDocumento() {
  const { default: TipoDocumento } = await import('../models/tipoDocumento.model.js');
  const [tipo] = await TipoDocumento.findOrCreate({
    where: { abreviatura: 'CC' },
    defaults: { abreviatura: 'CC', nombre_documento: 'Cédula de ciudadanía', estado: 'activo' }
  });
  return tipo.id_tipo_documento;
}

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

test('clientes create/get/update', async () => {
  const tipoId = await ensureTipoDocumento();

  const doc = `DOC${Date.now()}`;
  const phone = `+57${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const email = `cliente.${Date.now()}@local.test`;
  const { default: Cliente } = await import('../models/cliente.model.js');

  const createRes = await api('/api/v1/client', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      primer_nombre: 'Ana',
      segundo_nombre: 'Maria',
      primer_apellido: 'Gomez',
      segundo_apellido: 'Lopez',
      numero_documento: doc,
      correo_electronico: email,
      numero_telefono: phone,
      id_tipo_documento: tipoId
    })
  });
  assert.equal(createRes.status, 201);
  const clientId = createRes.json?.id_cliente;
  assert.ok(clientId, 'client id missing');

  const getRes = await api(`/api/v1/client/${clientId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(getRes.status, 200);

  const newPhone = `+57${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const updateRes = await api(`/api/v1/client/${clientId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      primer_nombre: 'Ana',
      segundo_nombre: 'Maria',
      primer_apellido: 'Gomez',
      segundo_apellido: 'Lopez',
      numero_documento: doc,
      correo_electronico: email,
      numero_telefono: newPhone,
      id_tipo_documento: tipoId
    })
  });
  assert.equal(updateRes.status, 200);

  await Cliente.destroy({ where: { id_cliente: clientId } });
});

test('teardown server', async () => {
  await stopTestServer();
});
