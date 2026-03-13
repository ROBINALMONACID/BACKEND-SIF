import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller.js';
import { authenticate, requireVendedor } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/client - Get all clients with pagination and search
router.get('/client', authenticate, requireVendedor, ClienteController.getAll);

// GET /api/v1/client/simple - Get all clients without pagination (for frontend compatibility)
router.get('/client/simple', authenticate, requireVendedor, ClienteController.getAllSimple);

// GET /api/v1/client/:id - Get client by ID
router.get('/client/:id', authenticate, requireVendedor, ClienteController.getById);

// POST /api/v1/client - Create a new client
router.post('/client', authenticate, requireVendedor, ClienteController.create);

// PUT /api/v1/client/:id - Update client
router.put('/client/:id', authenticate, requireVendedor, ClienteController.update);

export default router;