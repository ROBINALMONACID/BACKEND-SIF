import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

// Calcular la ruta del .env relativa a este archivo (funciona independientemente de process.cwd()).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql'
     });

     async function testConnection() {
        try {
            await sequelize
            .authenticate()
            .then(()=> {
            console.log('DATABASE CONNECTED...');
        });
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        } 
    }
    testConnection();

export default sequelize;