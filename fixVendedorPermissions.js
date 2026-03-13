import Usuario from './src/models/usuario.model.js';
import UsuarioRol from './src/models/usuarioRol.model.js';
import Rol from './src/models/rol.model.js';
import sequelize from './src/config/connect.db.js';
import { modelsApp } from './src/config/models.app.js';

// Inicializar asociaciones
modelsApp(false);

async function fixVendedorPermissions() {
  try {
    console.log('Corrigiendo permisos del usuario vendedor@test.com...');

    // Buscar el usuario vendedor@test.com
    const usuario = await Usuario.findOne({
      where: { correo_electronico: 'vendedor@test.com' }
    });

    if (!usuario) {
      console.log('Usuario vendedor@test.com no encontrado');
      return;
    }

    console.log('Usuario encontrado:', usuario.id_usuario);

    // Buscar roles
    const rolAdmin = await Rol.findOne({ where: { nombre_rol: 'Administrador' } });
    const rolVendedor = await Rol.findOne({ where: { nombre_rol: 'Vendedor' } });

    if (!rolVendedor) {
      console.log('Rol Vendedor no encontrado');
      return;
    }

    // Obtener roles actuales del usuario
    const rolesActuales = await UsuarioRol.findAll({
      where: { id_usuario: usuario.id_usuario },
      include: [{ model: Rol, as: 'rol' }]
    });

    console.log('Roles actuales:', rolesActuales.map(r => r.rol.nombre_rol));

    // Remover rol Administrador si existe
    if (rolAdmin) {
      const adminAsignado = rolesActuales.find(r => r.id_rol === rolAdmin.id_rol);
      if (adminAsignado) {
        await UsuarioRol.destroy({
          where: {
            id_usuario: usuario.id_usuario,
            id_rol: rolAdmin.id_rol
          }
        });
        console.log('Rol Administrador removido');
      }
    }

    // Asegurar que tenga rol Vendedor
    const vendedorAsignado = rolesActuales.find(r => r.id_rol === rolVendedor.id_rol);
    if (!vendedorAsignado) {
      await UsuarioRol.create({
        id_usuario: usuario.id_usuario,
        id_rol: rolVendedor.id_rol
      });
      console.log('Rol Vendedor asignado');
    } else {
      console.log('Rol Vendedor ya asignado');
    }

    // Verificar roles finales
    const rolesFinales = await UsuarioRol.findAll({
      where: { id_usuario: usuario.id_usuario },
      include: [{ model: Rol, as: 'rol' }]
    });

    console.log('Roles finales:', rolesFinales.map(r => r.rol.nombre_rol));
    console.log('Permisos corregidos: Vendedor tiene todos los permisos menos crear usuarios');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixVendedorPermissions();