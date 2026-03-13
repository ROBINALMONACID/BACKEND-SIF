import { Router } from 'express';
import UploadController from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Rutas de upload (protegidas con autenticación)
router.post('/product', authenticate, upload.single('image'), UploadController.uploadProductImage);
router.post('/client', authenticate, upload.single('image'), UploadController.uploadClientImage);

export default router;
