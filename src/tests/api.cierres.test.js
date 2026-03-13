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

test('cierres CRUD', async () => {
  const tipoId = await ensureTipoDocumento();
  const { default: ProductoRecibo } = await import('../models/productoRecibo.model.js');
  const { default: ReciboCaja } = await import('../models/reciboCaja.model.js');
  const { default: Producto } = await import('../models/producto.model.js');
  const { default: Categoria } = await import('../models/categoria.model.js');
  const { default: Cliente } = await import('../models/cliente.model.js');

  const doc = `DOC${Date.now()}`;
  const phone = `+57${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const email = `cliente.${Date.now()}@local.test`;

  const clienteRes = await api('/api/v1/client', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      primer_nombre: 'Laura',
      segundo_nombre: 'Isabel',
      primer_apellido: 'Torres',
      segundo_apellido: 'Ruiz',
      numero_documento: doc,
      correo_electronico: email,
      numero_telefono: phone,
      id_tipo_documento: tipoId
    })
  });
  assert.equal(clienteRes.status, 201);
  const clientId = clienteRes.json?.id_cliente;

  const categoryName = `Cat ${Date.now()}`;
  const createCat = await api('/api/v1/categoria', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre_categoria: categoryName })
  });
  assert.equal(createCat.status, 201);
  const categoryId = createCat.json?.id_categoria;

  const sku = `SKU-C-${Date.now()}`;
  const createProd = await api('/api/v1/product', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      codigo_sku: sku,
      nombre_producto: 'Producto Cierre',
      id_categoria: categoryId,
      stock: 10,
      precio_unitario: 7000
    })
  });
  assert.equal(createProd.status, 201);
  const productId = createProd.json?.id_producto;

  const createRecibo = await api('/api/v1/recibo-caja', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      id_cliente: clientId,
      tipo_pago: 'efectivo',
      productos: [{ id_producto: productId, cantidad: 1 }]
    })
  });
  assert.equal(createRecibo.status, 201);

  const fechaReferencia = new Date().toISOString().split('T')[0];
  const cierreRes = await api('/api/v1/cierre-caja', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      tipo_periodo: 'diario',
      fecha_referencia: fechaReferencia,
      id_usuario: 'test_admin'
    })
  });
  assert.equal(cierreRes.status, 201);
  const cierreId = cierreRes.json?.id_cierre_caja;
  assert.ok(cierreId, 'cierre id missing');

  const getRes = await api(`/api/v1/cierre-caja/${cierreId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(getRes.status, 200);

  const updateRes = await api(`/api/v1/cierre-caja/${cierreId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ total_ventas: 12345, cantidad_recibos: 1 })
  });
  assert.equal(updateRes.status, 200);

  const deleteRes = await api(`/api/v1/cierre-caja/${cierreId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(deleteRes.status, 200);

  await ProductoRecibo.destroy({ where: { id_recibo_caja: createRecibo.json?.id_recibo_caja } });
  await ReciboCaja.destroy({ where: { id_recibo_caja: createRecibo.json?.id_recibo_caja } });
  await Producto.destroy({ where: { id_producto: productId } });
  await Categoria.destroy({ where: { id_categoria: categoryId } });
  await Cliente.destroy({ where: { id_cliente: clientId } });
});

test('teardown server', async () => {
  await stopTestServer();
});
