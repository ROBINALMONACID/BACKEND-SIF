import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';
import bcrypt from 'bcrypt';
import sequelize from './src/config/connect.db.js';

async function insertTestUser() {
  try {
    console.log('Insertando usuario de prueba...');

    // Verificar si ya existe el rol "Vendedor"
    console.log('Buscando rol "Vendedor"...');
    let rolVendedor = await Rol.findOne({ where: { nombre_rol: 'Vendedor' } });

    if (rolVendedor) {
      console.log('El rol "Vendedor" no existe. Ejecuta primero insertRoles.js');
      return;
    }

    console.log('Rol "Vendedor" encontrado:', rolVendedor.id_rol);

    // Verificar si ya existe el usuario de prueba
    console.log('Verificando si el usuario ya existe...');
    let usuarioExistente = await Usuario.findOne({
      where: { correo_electronico: 'vendedor@test.com' }
    });

    if (usuarioExistente) {
      console.log('El usuario de prueba ya existe');
      console.log('Usuario:', usuarioExistente.id_usuario);
      console.log('Email:', usuarioExistente.correo_electronico);
      return;
    }

    console.log('Creando hash de contraseña...');
    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('123456', 10);

    console.log('Creando usuario...');
    const nuevoUsuario = await Usuario.create({
      id_usuario: 'vendedor_' + Date.now(),
      contraseña: hashedPassword,
      correo_electronico: 'vendedor@test.com',
      activado: true,
      idioma: 'es'
    });

    console.log('Asignando rol "Vendedor"...');
    // Asignar rol "Vendedor"
    await UsuarioRol.create({
      id_usuario: nuevoUsuario.id_usuario,
      id_rol: rolVendedor.id_rol
    });

    console.log('Usuario de prueba creado exitosamente');
    console.log('ID Usuario:', nuevoUsuario.id_usuario);
    console.log('Email:', nuevoUsuario.correo_electronico);
    console.log('Contraseña: 123456');
    console.log('Rol: Vendedor');

    console.log('\nPara probar el sistema de roles:');
    console.log('1. Inicia sesión con: vendedor@test.com / 123456');
    console.log('2. El endpoint /api/v1/cierre-caja debería funcionar');
    console.log('3. Solo debería tener permisos de "Vendedor" (no de "Administrador")');

  } catch (error) {
    console.error('Error creando usuario de prueba:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  insertTestUser();
}

export default insertTestUser;