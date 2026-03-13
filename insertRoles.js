import Rol from './src/models/rol.model.js';
import sequelize from './src/config/connect.db.js';

async function insertRoles() {
  try {
    await sequelize.sync();

    const roles = [
      { nombre_rol: 'Administrador' },
      { nombre_rol: 'Vendedor' }
    ];

    for (const rol of roles) {
      await Rol.upsert(rol, {
        fields: ['nombre_rol']
      });
    }

    console.log('Roles insertados exitosamente');
  } catch (error) {
    console.error('Error insertando roles:', error);
  } finally {
    await sequelize.close();
  }
}

insertRoles();