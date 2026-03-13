import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';
import bcrypt from 'bcrypt';
import sequelize from './src/config/connect.db.js';
import { modelsApp } from './src/config/models.app.js';

// Inicializar asociaciones
modelsApp(false);

async function createTestUser() {
  try {
    console.log('Creando usuario de prueba manualmente...');

    // Buscar rol Vendedor
    const rolVendedor = await Rol.findOne({ where: { nombre_rol: 'Vendedor' } });
    if (!rolVendedor) {
      console.log('Rol Vendedor no encontrado');
      return;
    }

    // Crear usuario directamente
    const hashedPassword = await bcrypt.hash('123456', 10);
    const userId = 'vendedor_test_' + Date.now();

    const usuario = await Usuario.create({
      id_usuario: userId,
      contraseña: hashedPassword,
      correo_electronico: 'vendedor@test.com',
      activado: true,
      idioma: 'es'
    });

    console.log('Usuario creado:', usuario.id_usuario);

    // Asignar rol
    await UsuarioRol.create({
      id_usuario: usuario.id_usuario,
      id_rol: rolVendedor.id_rol
    });

    console.log('Rol asignado');

    console.log('\nUsuario de prueba creado:');
    console.log('ID:', usuario.id_usuario);
    console.log('Email: vendedor@test.com');
    console.log('Password: 123456');
    console.log('Rol: Vendedor');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestUser();