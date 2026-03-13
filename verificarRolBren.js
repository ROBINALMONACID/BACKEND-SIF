/**
 * Script para verificar el rol actual de bren@gmail.com en la BD
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const verificarRolUsuario = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'petshop_db'
  });

  try {
    console.log('========================================');
    console.log('VERIFICANDO ROL DE bren@gmail.com');
    console.log('========================================\n');

    const [rows] = await connection.execute(`
      SELECT 
        u.id_usuario,
        u.correo_electronico,
        u.activado,
        r.id_rol,
        r.nombre_rol,
        ur.id_usuario as tiene_rol
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      WHERE u.correo_electronico = 'bren@gmail.com'
    `);

    if (rows.length === 0) {
      console.log('Usuario no encontrado en la base de datos');
      return;
    }

    const usuario = rows[0];
    
    console.log('INFORMACIÓN DEL USUARIO:');
    console.log('─────────────────────────────────────────');
    console.log('ID Usuario:', usuario.id_usuario);
    console.log('Email:', usuario.correo_electronico);
    console.log('Activado:', usuario.activado ? 'Sí' : 'No');
    console.log('\nROL ACTUAL EN BASE DE DATOS:');
    console.log('─────────────────────────────────────────');
    
    if (usuario.tiene_rol) {
      console.log('Rol ID:', usuario.id_rol);
      console.log('Rol Nombre:', usuario.nombre_rol);
    } else {
      console.log('Usuario NO tiene rol asignado en usuario_rol');
    }

    console.log('\n');
    console.log('========================================');
    console.log('COMPARACIÓN:');
    console.log('========================================');
    console.log('En BD:', usuario.nombre_rol || 'SIN ROL');
    console.log('En localStorage (según logs): Administrador');
    console.log('');
    
    if (usuario.nombre_rol === 'Administrador') {
      console.log('COINCIDE - El rol en BD es Administrador');
      console.log('Necesitas cambiar el rol en BD a Vendedor');
    } else if (usuario.nombre_rol === 'Vendedor') {
      console.log('NO COINCIDE - El rol en BD es Vendedor pero localStorage tiene Administrador');
      console.log('Solución: Haz logout y vuelve a hacer login para actualizar');
    } else {
      console.log('Usuario sin rol en BD');
    }

    console.log('\n========================================');
    console.log('PARA CAMBIAR EL ROL A VENDEDOR:');
    console.log('========================================');
    console.log(`
UPDATE usuario_rol 
SET id_rol = 2 
WHERE id_usuario = '${usuario.id_usuario}';
    `);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
};

verificarRolUsuario();
