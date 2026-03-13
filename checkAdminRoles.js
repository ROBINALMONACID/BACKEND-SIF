import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';
import sequelize from './src/config/connect.db.js';
import { modelsApp } from './src/config/models.app.js';

// Inicializar asociaciones
modelsApp(false);

async function checkAdminRoles() {
  try {
    console.log('Verificando roles del administrador...');

    // Buscar usuario admin
    const adminUser = await Usuario.findOne({
      where: { correo_electronico: 'admin@vetshop.com' }
    });

    if (!adminUser) {
      console.log('Usuario admin@vetshop.com no encontrado');
      return;
    }

    console.log('Usuario admin encontrado:', adminUser.id_usuario);

    // Obtener roles
    const roles = await UsuarioRol.findAll({
      where: { id_usuario: adminUser.id_usuario },
      include: [{ model: Rol, as: 'rol' }]
    });

    console.log('Roles del admin:', roles.map(r => r.rol.nombre_rol));

    // Verificar si tiene Administrador
    const hasAdmin = roles.some(r => r.rol.nombre_rol === 'Administrador');
    console.log('Tiene rol Administrador:', hasAdmin);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkAdminRoles();