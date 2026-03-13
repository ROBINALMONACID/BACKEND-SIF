import jwt from 'jsonwebtoken';
import { createError } from '../utils/errorHelper.js';

// Middleware to check if user is authenticated
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json(createError('ERR_005', 'Token de acceso requerido'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Error verificando token:', error.message);
      
      // Token expirado
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(createError('ERR_004', 'Sesión expirada. Inicia sesión nuevamente.'));
      }
      
      // Token inválido
      return res.status(401).json(createError('ERR_005', 'Token de autenticación inválido'));
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json(createError('ERR_900', 'Error de autenticación', null, { stack: error.stack }));
  }
};

// Middleware to check user role
export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(createError('ERR_005', 'Usuario no autenticado'));
      }

      const userRoles = req.user.roles || [];

      console.log(`Roles del usuario ${req.user.id_usuario}:`, userRoles);
      console.log(`Roles permitidos para esta ruta:`, allowedRoles);

      // Check if user has any of the allowed roles
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        console.log(`Acceso DENEGADO - Usuario no tiene los roles requeridos`);
        return res.status(403).json(createError(
          'ERR_006',
          'No tienes permiso para acceder a este recurso.',
          null,
          `Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
        ));
      }

      console.log(`Acceso PERMITIDO - Usuario tiene los roles requeridos`);

      next();
    } catch (error) {
      console.error('Error en middleware de autorización:', error);
      res.status(500).json(createError('ERR_900', 'Error verificando permisos', null, { stack: error.stack }));
    }
  };
};

// Specific role middlewares
export const requireAdmin = authorize(['Administrador']);
export const requireVendedor = authorize(['Administrador', 'Vendedor']);
export const requireAnyRole = authorize(['Administrador', 'Vendedor']);