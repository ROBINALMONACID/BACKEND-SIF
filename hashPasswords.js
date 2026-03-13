import Usuario from './src/models/usuario.model.js';
import bcrypt from 'bcrypt';
import sequelize from './src/config/connect.db.js';

async function hashExistingPasswords() {
  try {
    await sequelize.sync();

    // Get all users
    const users = await Usuario.findAll();

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (user.contraseña && !user.contraseña.startsWith('$2')) {
        console.log(`Hasheando contraseña para usuario: ${user.correo_electronico}`);
        const hashedPassword = await bcrypt.hash(user.contraseña, 10);
        await Usuario.update(
          { contraseña: hashedPassword },
          { where: { id_usuario: user.id_usuario } }
        );
        console.log(`Contraseña hasheada para: ${user.correo_electronico}`);
      }
    }

    console.log('Proceso completado');
  } catch (error) {
    console.error('Error hasheando contraseñas:', error);
  } finally {
    await sequelize.close();
  }
}

hashExistingPasswords();