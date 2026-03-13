import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';
import { modelsApp } from './src/config/models.app.js';

// Inicializar asociaciones
modelsApp(false);

async function checkUsers() {
  try {
    console.log('Verificando usuarios en la base de datos...');

    // Primero verificar roles
    const roles = await Rol.findAll();
    console.log(`Total de roles encontrados: ${roles.length}`);
    roles.forEach((r, index) => {
      console.log(`${index + 1}. ${r.nombre_rol} (ID: ${r.id_rol})`);
    });

    // Luego verificar usuarios
    const usuarios = await Usuario.findAll();
    console.log(`\nTotal de usuarios encontrados: ${usuarios.length}`);

    if (usuarios.length === 0) {
      console.log('No hay usuarios en la base de datos');
      return;
    }

    console.log('\nLista de usuarios:');
    for (const [index, u] of usuarios.entries()) {
      // Obtener roles del usuario
      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: u.id_usuario },
        include: [{ model: Rol, as: 'rol' }]
      });

      const roleNames = userRoles.map(ur => ur.rol?.nombre_rol).filter(Boolean);
      console.log(`${index + 1}. ${u.correo_electronico}: ${roleNames.join(', ') || 'Sin roles'}`);
      console.log(`   ID: ${u.id_usuario}`);
    }

  } catch (error) {
    console.error('Error verificando usuarios:', error.message);
  }
}

checkUsers();