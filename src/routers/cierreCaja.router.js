import { Router } from 'express';
import { CierreCajaController } from '../controllers/cierreCaja.controller.js';
import { authenticate, requireVendedor } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/cierre-caja - Get all closures with filters
router.get('/cierre-caja', authenticate, requireVendedor, CierreCajaController.getAll);

// GET /api/v1/cierre-caja/simple - Get all closures without pagination
router.get('/cierre-caja/simple', authenticate, requireVendedor, CierreCajaController.getAllSimple);

// GET /api/v1/cierre-caja/:id - Get closure by ID
router.get('/cierre-caja/:id', authenticate, requireVendedor, CierreCajaController.getById);

// POST /api/v1/cierre-caja - Create a new closure
router.post('/cierre-caja', authenticate, requireVendedor, CierreCajaController.create);

// PUT /api/v1/cierre-caja/:id - Update closure (limited)
router.put('/cierre-caja/:id', authenticate, requireVendedor, CierreCajaController.update);

// DELETE /api/v1/cierre-caja/:id - Delete closure (recent only)
router.delete('/cierre-caja/:id', authenticate, requireVendedor, CierreCajaController.delete);

export default router;