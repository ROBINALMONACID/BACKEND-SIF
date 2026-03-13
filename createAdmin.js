import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';
import bcrypt from 'bcrypt';
import sequelize from './src/config/connect.db.js';

async function createAdminUser() {
  try {
    await sequelize.sync();

    // Check if admin role exists
    let adminRole = await Rol.findOne({ where: { nombre_rol: 'Administrador' } });
    if (!adminRole) {
      adminRole = await Rol.create({ nombre_rol: 'Administrador' });
      console.log('Rol Administrador creado');
    }

    // Check if admin user exists
    const adminEmail = 'admin@vetshop.com';
    let adminUser = await Usuario.findOne({ where: { correo_electronico: adminEmail } });

    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await Usuario.create({
        id_usuario: 'admin_' + Date.now(),
        contraseña: hashedPassword,
        correo_electronico: adminEmail,
        activado: true,
        idioma: 'es',
        url_imagen: null,
        clave_activacion: null,
        clave_restablecimiento: null,
        fecha_restablecimiento: null
      });
      console.log('Usuario administrador creado');

      // Assign admin role
      await UsuarioRol.create({
        id_usuario: adminUser.id_usuario,
        id_rol: adminRole.id_rol
      });
      console.log('Rol administrador asignado');
    } else {
      console.log('Usuario administrador ya existe');
    }

    console.log('Usuario administrador configurado correctamente');
    console.log('Email: admin@vetshop.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creando usuario administrador:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();