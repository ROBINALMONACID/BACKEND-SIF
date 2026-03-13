import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

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

    // Consulta SQL
    const [usuarios] = await connection.execute(`
      SELECT 
        u.id_usuario,
        u.correo_electronico,
        u.activado,
        u.fecha_creacion,
        GROUP_CONCAT(r.nombre_rol ORDER BY r.nombre_rol SEPARATOR ', ') AS roles
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      GROUP BY u.id_usuario, u.correo_electronico, u.activado, u.fecha_creacion
      ORDER BY u.fecha_creacion DESC
    `);

    console.log('='.repeat(80));
    console.log('USUARIOS REGISTRADOS EN EL SISTEMA');
    console.log('='.repeat(80));
    
    if (usuarios.length === 0) {
      console.log('\nNo hay usuarios registrados en el sistema\n');
      await connection.end();
      process.exit(0);
    }

    usuarios.forEach((usuario, index) => {
      const rolesStr = usuario.roles || 'SIN ROLES ASIGNADOS';
      const estadoStr = usuario.activado ? 'Activo' : 'Inactivo';
      
      console.log(`\n${index + 1}. Usuario: ${usuario.correo_electronico}`);
      console.log(`   ID: ${usuario.id_usuario}`);
      console.log(`   Roles: ${rolesStr}`);
      console.log(`   Estado: ${estadoStr}`);
      console.log(`   Fecha creación: ${new Date(usuario.fecha_creacion).toLocaleString('es-CO')}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal de usuarios: ${usuarios.length}\n`);

    // Cerrar conexión
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error al consultar usuarios:', error.message);
    process.exit(1);
  }
})();
