import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from '../routers/user.router.js';
import categoriaRoutes from '../routers/categoria.router.js';
import cierreCajaRoutes from '../routers/cierreCaja.router.js';
import clienteRoutes from '../routers/cliente.router.js';
import productoRoutes from '../routers/producto.router.js';
import reciboCajaRoutes from '../routers/reciboCaja.router.js';
import authRoutes from '../routers/auth.router.js';
import healthRoutes from '../routers/health.router.js';
import uploadRoutes from '../routers/upload.router.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(morgan('dev'));
app.use(cors());

app.use(express.json());

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas de la API
app.use('/api/v1', userRoutes);
app.use('/api/v1', categoriaRoutes);
app.use('/api/v1', cierreCajaRoutes);
app.use('/api/v1', clienteRoutes);
app.use('/api/v1', productoRoutes);
app.use('/api/v1', reciboCajaRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/', healthRoutes);

// Middleware para rutas no encontradas (debe estar después de todas las rutas)
app.use(notFoundHandler);

// Middleware global de manejo de errores (debe ser el último middleware)
app.use(errorHandler);

export default app;