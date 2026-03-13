import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller.js';
import { authenticate, requireVendedor } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/categoria - Get all categories
router.get('/categoria', authenticate, requireVendedor, CategoriaController.getAll);

// POST /api/v1/categoria - Create a new category
router.post('/categoria', authenticate, requireVendedor, CategoriaController.create);

// PUT /api/v1/categoria/:id - Update category
router.put('/categoria/:id', authenticate, requireVendedor, CategoriaController.update);

// DELETE /api/v1/categoria/:id - Delete category
router.delete('/categoria/:id', authenticate, requireVendedor, CategoriaController.delete);

// PUT /api/v1/categoria/:id/toggle - Toggle status
router.put('/categoria/:id/toggle', authenticate, requireVendedor, CategoriaController.toggleStatus);

export default router;