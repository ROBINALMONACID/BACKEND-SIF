import http from 'node:http';
import { once } from 'node:events';
import bcrypt from 'bcrypt';

const TEST_USER = {
  id_usuario: 'test_admin',
  correo_electronico: 'test.admin@local.test',
  password: 'Test1234!'
};

let server;
let baseUrl;

export async function startTestServer() {
  process.env.NODE_ENV = 'test';

  const { modelsApp } = await import('../config/models.app.js');
  modelsApp(false);

  const { default: app } = await import('../app/app.js');

  server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  return baseUrl;
}

export async function stopTestServer() {
  if (!server) return;
  server.close();
  await once(server, 'close');
  server = undefined;
  baseUrl = undefined;
}

export function getBaseUrl() {
  return baseUrl;
}

export async function ensureAdminUser() {
  const { default: Usuario } = await import('../models/usuario.model.js');
  const { default: Rol } = await import('../models/rol.model.js');
  const { default: UsuarioRol } = await import('../models/usuarioRol.model.js');

  const passwordHash = await bcrypt.hash(TEST_USER.password, 10);

  await Usuario.upsert({
    id_usuario: TEST_USER.id_usuario,
    correo_electronico: TEST_USER.correo_electronico,
    "contrase\u00f1a": passwordHash,
    activado: true,
    idioma: 'es'
  });

  const [role] = await Rol.findOrCreate({
    where: { nombre_rol: 'Administrador' },
    defaults: { nombre_rol: 'Administrador' }
  });

  await UsuarioRol.findOrCreate({
    where: { id_usuario: TEST_USER.id_usuario, id_rol: role.id_rol },
    defaults: { id_usuario: TEST_USER.id_usuario, id_rol: role.id_rol }
  });

  return { email: TEST_USER.correo_electronico, password: TEST_USER.password };
}
