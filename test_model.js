// Test simple para verificar si el modelo carga sin errores
import sequelize from './src/config/connect.db.js';
import CierreCaja from './src/models/cierreCaja.model.js';

async function test() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión exitosa');
    
    console.log('Intentando consultar cierres...');
    const cierres = await CierreCaja.findAll({ limit: 1 });
    console.log('Consulta exitosa, registros encontrados:', cierres.length);
    
    console.log('\nEstructura del modelo:');
    console.log('Columns:', Object.keys(CierreCaja.rawAttributes));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
