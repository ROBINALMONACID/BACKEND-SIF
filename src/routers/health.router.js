import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();

// GET /api/v1/health - Health check
router.get('/health', HealthController.check);

export default router;