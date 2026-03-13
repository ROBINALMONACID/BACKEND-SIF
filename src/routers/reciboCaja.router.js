import { Router } from 'express';
import { ReciboCajaController } from '../controllers/reciboCaja.controller.js';
import { authenticate, requireVendedor } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/recibo-caja - Get all receipts with optional filters
router.get('/recibo-caja', authenticate, requireVendedor, ReciboCajaController.getAll);

// GET /api/v1/recibo-caja/last - Get last receipt
router.get('/recibo-caja/last', authenticate, requireVendedor, ReciboCajaController.getLast);

// GET /api/v1/recibo-caja/:id - Get receipt by ID with details
router.get('/recibo-caja/:id', authenticate, requireVendedor, ReciboCajaController.getById);

// GET /api/v1/recibo-caja/:id/items - Get receipt items
router.get('/recibo-caja/:id/items', authenticate, requireVendedor, ReciboCajaController.getItems);

// POST /api/v1/recibo-caja - Create a new receipt
router.post('/recibo-caja', authenticate, requireVendedor, ReciboCajaController.create);

// PUT /api/v1/recibo-caja/:id - Update receipt
router.put('/recibo-caja/:id', authenticate, requireVendedor, ReciboCajaController.update);

// DELETE /api/v1/recibo-caja/:id - Delete receipt
router.delete('/recibo-caja/:id', authenticate, requireVendedor, ReciboCajaController.delete);

// POST /api/v1/recibo-caja/debug - Debug endpoint (protegido)
router.post('/recibo-caja/debug', authenticate, requireVendedor, ReciboCajaController.debug);

// GET /api/v1/recibo-caja/:id/print - Print receipt data
router.get('/recibo-caja/:id/print', authenticate, requireVendedor, ReciboCajaController.print);

export default router;
