import TipoDocumento from './src/models/tipoDocumento.model.js';
import sequelize from './src/config/connect.db.js';

async function insertTipoDocumento() {
  try {
    await sequelize.sync();

    const tipos = [
      { abreviatura: 'CC', nombre_documento: 'Cédula de Ciudadanía', estado: 'activo' },
      { abreviatura: 'CE', nombre_documento: 'Cédula de Extranjería', estado: 'activo' },
      { abreviatura: 'PP', nombre_documento: 'Pasaporte', estado: 'activo' }
    ];

    for (const tipo of tipos) {
      await TipoDocumento.upsert(tipo, {
        fields: ['abreviatura', 'nombre_documento', 'estado']
      });
    }

    console.log('Tipos de documento insertados exitosamente');
  } catch (error) {
    console.error('Error insertando tipos de documento:', error);
  } finally {
    await sequelize.close();
  }
}

insertTipoDocumento();