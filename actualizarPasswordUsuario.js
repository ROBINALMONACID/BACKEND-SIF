import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const USUARIO_EMAIL = 'juan@gmail.com';
const NUEVA_PASSWORD = 'password123'; // Cambia esto a la contraseña que quieras

(async () => {
  try {
    // Crear conexión
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'my_database_petshop'
    });

    console.log('\nConexión a base de datos establecida\n');

    // Buscar usuario
    const [usuarios] = await connection.execute(
      'SELECT id_usuario, correo_electronico FROM usuarios WHERE correo_electronico = ?',
      [USUARIO_EMAIL]
    );

    if (usuarios.length === 0) {
      console.log(`Usuario con email ${USUARIO_EMAIL} no encontrado\n`);
      await connection.end();
      process.exit(1);
    }

    const usuario = usuarios[0];
    console.log(`Usuario encontrado: ${usuario.correo_electronico}`);
    console.log(`   ID: ${usuario.id_usuario}\n`);

    // Hashear nueva contraseña
    console.log('Hasheando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(NUEVA_PASSWORD, 10);

    // Actualizar contraseña
    const [result] = await connection.execute(
      'UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?',
      [hashedPassword, usuario.id_usuario]
    );

    if (result.affectedRows > 0) {
      console.log('Contraseña actualizada exitosamente!\n');
      console.log('='.repeat(60));
      console.log('CREDENCIALES ACTUALIZADAS:');
      console.log('='.repeat(60));
      console.log(`Email:    ${USUARIO_EMAIL}`);
      console.log(`Password: ${NUEVA_PASSWORD}`);
      console.log('='.repeat(60));
      console.log('\nAhora puedes iniciar sesión con estas credenciales\n');
    } else {
      console.log('No se pudo actualizar la contraseña\n');
    }

    // Cerrar conexión
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
