import sequelize from './src/config/connect.db.js';

async function fixTable() {
  try {
    console.log('Agregando columnas a tabla cierres_caja...');
    
    const queries = [
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS turno VARCHAR(50) DEFAULT 'único'`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS numero_caja VARCHAR(20) DEFAULT 'Caja 1'`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS ventas_efectivo DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS ventas_tarjeta_credito DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS ventas_tarjeta_debito DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS ventas_otros DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS devoluciones DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS descuentos DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS anulaciones DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS cantidad_recibos INT DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS efectivo_contado DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS diferencia_caja DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS retiros_caja DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS ingresos_extraordinarios DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS cambio_inicial DECIMAL(12,2) DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS productos_vendidos INT DEFAULT 0`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS ajustes_stock TEXT`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS firma_cajero BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS firma_supervisor BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS observaciones TEXT`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS incidencias TEXT`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE cierres_caja ADD COLUMN IF NOT EXISTS estado ENUM('abierto', 'cerrado') DEFAULT 'cerrado'`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log(`${query.substring(0, 50)}...`);
      } catch (err) {
        if (err.message.includes('Duplicate column')) {
          console.log(`Columna ya existe: ${query.substring(30, 50)}`);
        } else {
          throw err;
        }
      }
    }

    console.log('Tabla actualizada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixTable();
