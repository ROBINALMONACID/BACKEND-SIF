import sequelize from './src/config/connect.db.js';

async function addUrlImagenColumn() {
  try {
    console.log('Agregando columna url_imagen a la tabla productos...');
    
    await sequelize.query(`
      ALTER TABLE productos 
      ADD COLUMN IF NOT EXISTS url_imagen VARCHAR(255) DEFAULT NULL;
    `);
    
    console.log('Columna url_imagen agregada exitosamente');
    
    // Verificar que se agregó correctamente
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM productos LIKE 'url_imagen';
    `);
    
    if (columns.length > 0) {
      console.log('Verificación exitosa: columna url_imagen existe');
      console.log('Detalles:', columns[0]);
    } else {
      console.log('La columna no se encontró después de agregarla');
    }
    
    await sequelize.close();
    console.log('Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

addUrlImagenColumn();
