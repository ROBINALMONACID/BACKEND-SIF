import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/auth/login', AuthController.login);

// POST /api/v1/login - Alias para compatibilidad con frontend
router.post('/login', AuthController.login);

// POST /api/v1/auth/logout
router.post('/auth/logout', AuthController.logout);

// POST /api/v1/logout - Alias para compatibilidad
router.post('/logout', AuthController.logout);

// GET /api/v1/auth/profile - Get current user info (según guía frontend)
router.get('/auth/profile', authenticate, AuthController.me);

// GET /api/v1/me - Alias para compatibilidad
router.get('/me', authenticate, AuthController.me);

// GET /api/v1/auth/test-roles - Test endpoint for role verification
router.get('/auth/test-roles', authenticate, AuthController.testRoles);

export default router;