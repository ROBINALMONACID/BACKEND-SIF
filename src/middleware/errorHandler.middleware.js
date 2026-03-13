import { createError } from '../utils/errorHelper.js';

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en la cadena
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error capturado por errorHandler middleware:', err);

  // Si ya se envió la respuesta, delegar al manejador de errores por defecto
  if (res.headersSent) {
    return next(err);
  }

  // Errores de Sequelize - Validación
  if (err.name === 'SequelizeValidationError') {
    const field = err.errors[0]?.path;
    const message = err.errors[0]?.message;
    return res.status(400).json(createError('ERR_801', message, field, { 
      validationErrors: err.errors 
    }));
  }

  // Errores de Sequelize - Clave única duplicada
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path;
    
    // Mapear campos a códigos de error específicos
    if (field === 'numero_documento') {
      return res.status(409).json(createError('ERR_204', null, 'numero_documento'));
    }
    if (field === 'numero_telefono') {
      return res.status(409).json(createError('ERR_211', null, 'numero_telefono'));
    }
    if (field === 'correo_electronico') {
      return res.status(409).json(createError('ERR_101', null, 'correo_electronico'));
    }
    if (field === 'codigo_sku') {
      return res.status(409).json(createError('ERR_302', null, 'codigo_sku'));
    }
    
    // Duplicado genérico
    return res.status(409).json(createError('ERR_703', null, field));
  }

  // Errores de Sequelize - Clave foránea
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const field = err.fields?.[0];
    return res.status(400).json(createError('ERR_702', 'Violación de restricción de integridad', field, {
      constraint: err.index
    }));
  }

  // Errores de Sequelize - Conexión a BD
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    return res.status(503).json(createError('ERR_700', 'Error de conexión a base de datos'));
  }

  // Errores de Sequelize - Timeout
  if (err.name === 'SequelizeTimeoutError') {
    return res.status(504).json(createError('ERR_705'));
  }

  // Errores de autenticación JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(createError('ERR_005'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(createError('ERR_004'));
  }

  // Error de sintaxis JSON en el body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(createError('ERR_801', 'JSON inválido en el cuerpo de la petición'));
  }

  // Error genérico del servidor
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json(createError(
    'ERR_900',
    err.message || 'Error interno del servidor',
    null,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  ));
};

/**
 * Middleware para rutas no encontradas (404)
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json(createError(
    'ERR_901',
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    null,
    { method: req.method, url: req.originalUrl }
  ));
};
