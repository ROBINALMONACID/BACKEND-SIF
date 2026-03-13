import db from './src/config/connect.db.js';
import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';

(async () => {
  try {
    // Conectar a la base de datos
    await db.authenticate();
    console.log('\nConexión a base de datos establecida\n');

    // Consultar usuarios con sus roles
    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'correo_electronico', 'activado', 'fecha_creacion'],
      include: [{
        model: UsuarioRol,
        required: false, // LEFT JOIN
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['nombre_rol']
        }]
      }],
      order: [['fecha_creacion', 'DESC']]
    });

    console.log('='.repeat(80));
    console.log('USUARIOS REGISTRADOS EN EL SISTEMA');
    console.log('='.repeat(80));
    
    if (usuarios.length === 0) {
      console.log('\nNo hay usuarios registrados en el sistema\n');
      process.exit(0);
    }

    usuarios.forEach((usuario, index) => {
      const roles = usuario.usuario_rols
        ?.map(ur => ur.rol?.nombre_rol)
        .filter(Boolean) || [];
      
      const rolesStr = roles.length > 0 ? roles.join(', ') : 'SIN ROLES ASIGNADOS';
      const estadoStr = usuario.activado ? 'Activo' : 'Inactivo';
      
      console.log(`\n${index + 1}. Usuario: ${usuario.correo_electronico}`);
      console.log(`   ID: ${usuario.id_usuario}`);
      console.log(`   Roles: ${rolesStr}`);
      console.log(`   Estado: ${estadoStr}`);
      console.log(`   Fecha creación: ${usuario.fecha_creacion}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal de usuarios: ${usuarios.length}\n`);

    // Cerrar conexión
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al consultar usuarios:', error.message);
    process.exit(1);
  }
})();
