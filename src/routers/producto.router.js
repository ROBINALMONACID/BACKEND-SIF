import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller.js';
import { authenticate, requireVendedor } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/product/simple - Get all products without pagination (DEBE IR ANTES de /:id)
router.get('/product/simple', authenticate, requireVendedor, ProductoController.getAllSimple);

// GET /api/v1/products/simple - Alias for backward compatibility
router.get('/products/simple', authenticate, requireVendedor, ProductoController.getAllSimple);

// GET /api/v1/product - Get all products
router.get('/product', authenticate, requireVendedor, ProductoController.getAll);

// GET /api/v1/products - Alias for backward compatibility
router.get('/products', authenticate, requireVendedor, ProductoController.getAll);

// GET /api/v1/product/:id - Get product by ID
router.get('/product/:id', authenticate, requireVendedor, ProductoController.getById);

// POST /api/v1/product - Create a new product
router.post('/product', authenticate, requireVendedor, ProductoController.create);

// PUT /api/v1/product/:id - Update product
router.put('/product/:id', authenticate, requireVendedor, ProductoController.update);

// DELETE /api/v1/product/:id - Delete product
router.delete('/product/:id', authenticate, requireVendedor, ProductoController.delete);

export default router;