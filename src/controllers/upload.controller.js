import { createError } from '../utils/errorHelper.js';

export default class UploadController {
  // Upload de imagen de producto
  static async uploadProductImage(req, res) {
    try {
      console.log('Upload request recibido');
      console.log('File:', req.file);
      
      if (!req.file) {
        console.log('No se recibió ningún archivo');
        return res.status(400).json(createError('ERR_801', 'No se proporcionó archivo', 'image'));
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;
      
      const response = {
        success: true,
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
      
      console.log('Upload exitoso, respondiendo con:', response);
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      
      // Error de Multer para archivo muy grande
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(createError('ERR_803', 'Archivo muy grande (máximo 5MB)', 'image'));
      }
      
      // Error de tipo de archivo no permitido
      if (error.message.includes('Solo se permiten archivos de imagen')) {
        return res.status(400).json(createError('ERR_802', error.message, 'image'));
      }
      
      res.status(500).json(createError('ERR_900', error.message));
    }
  }

  // Upload de imagen de cliente (futuro)
  static async uploadClientImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json(createError('ERR_801', 'No se proporcionó archivo', 'image'));
      }

      const imageUrl = `/uploads/clients/${req.file.filename}`;
      
      res.status(200).json({
        success: true,
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Error al subir imagen:', error);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(createError('ERR_803', 'Archivo muy grande (máximo 5MB)', 'image'));
      }
      
      if (error.message.includes('Solo se permiten archivos de imagen')) {
        return res.status(400).json(createError('ERR_802', error.message, 'image'));
      }
      
      res.status(500).json(createError('ERR_900', error.message));
    }
  }
}
