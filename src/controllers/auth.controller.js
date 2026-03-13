import Usuario from '../models/usuario.model.js';
import UsuarioRol from '../models/usuarioRol.model.js';
import Rol from '../models/rol.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createError } from '../utils/errorHelper.js';

export class AuthController {
  // Login
  static async login(req, res) {
    const { email, password } = req.body;

    console.log('Intento de login:', { email, password: '***' });

    try {
      // Validaciones
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json(createError('ERR_103', 'Correo electrónico inválido', 'email'));
      }
      if (!password) {
        return res.status(400).json(createError('ERR_003', 'Contraseña requerida', 'password'));
      }

      // Buscar usuario
      const user = await Usuario.findOne({ where: { correo_electronico: email } });
      console.log('Usuario encontrado:', user ? { id: user.id_usuario, email: user.correo_electronico } : 'No encontrado');

      if (!user) {
        return res.status(401).json(createError('ERR_002', 'Usuario no encontrado'));
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.contraseña);
      console.log('Contraseña válida:', isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json(createError('ERR_003', 'Contraseña incorrecta'));
      }

      // Obtener roles del usuario
      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: user.id_usuario },
        include: [{ model: Rol, as: 'rol' }]
      });

      const roles = userRoles.map(ur => ur.rol?.nombre_rol).filter(Boolean);

      // Crear JWT token
      const token = jwt.sign(
        {
          userId: user.id_usuario,  // Cambiar a userId según guía
          id_usuario: user.id_usuario,  // Mantener para compatibilidad
          email: user.correo_electronico,  // Cambiar a email según guía
          correo_electronico: user.correo_electronico,  // Mantener para compatibilidad
          roles: roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Preparar datos del usuario sin contraseña
      const { contraseña, ...userData } = user.toJSON();

      console.log('Login exitoso, retornando token para:', { 
        id_usuario: userData.id_usuario, 
        correo_electronico: userData.correo_electronico, 
        roles 
      });

      // Formato de respuesta para frontend (token en nivel raíz)
      res.json({
        success: true,
        token: token,  // Token en nivel raíz para compatibilidad con frontend
        user: {
          id: userData.id_usuario,
          id_usuario: userData.id_usuario,  // Mantener ambos para compatibilidad
          email: userData.correo_electronico,
          correo_electronico: userData.correo_electronico,  // Mantener ambos
          nombre: `${userData.primer_nombre || ''} ${userData.primer_apellido || ''}`.trim() || 'Usuario',
          roles: roles  // Array de strings: ["Administrador"]
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      // For JWT, logout is handled on frontend by removing token
      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get current user info
  static async me(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json(createError('ERR_005', 'Token de autenticación inválido'));
      }

      // Get fresh user data from database
      const user = await Usuario.findByPk(req.user.id_usuario);
      if (!user) {
        return res.status(404).json(createError('ERR_100', 'Usuario no encontrado'));
      }

      // Get user roles
      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: user.id_usuario },
        include: [{ model: Rol, as: 'rol' }]
      });

      // Convertir roles a array de strings para compatibilidad
      const roles = userRoles.map(ur => ur.rol?.nombre_rol).filter(Boolean);

      const { contraseña, ...userData } = user.toJSON();

      console.log('GET /me - Usuario autenticado:', {
        id: userData.id_usuario,
        email: userData.correo_electronico,
        roles
      });

      // Formato de respuesta IDÉNTICO al login para consistencia
      res.json({
        success: true,
        user: {
          id: userData.id_usuario,
          id_usuario: userData.id_usuario,
          email: userData.correo_electronico,
          correo_electronico: userData.correo_electronico,
          nombre: `${userData.primer_nombre || ''} ${userData.primer_apellido || ''}`.trim() || 'Usuario',
          roles: roles  // Array de strings: ["Administrador"]
        }
      });
    } catch (error) {
      console.error('Error en GET /me:', error);
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Test endpoint to verify roles
  static async testRoles(req, res) {
    try {
      console.log('=== TEST ROLES ===');
      console.log('User from JWT:', req.user);

      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      res.json({
        user_id: req.user.id_usuario,
        roles: req.user.roles,
        permisos: {
          puede_ver_usuarios: req.user.roles.includes('Administrador'),
          puede_crear_usuarios: req.user.roles.includes('Administrador'),
          puede_ver_productos: req.user.roles.includes('Vendedor') || req.user.roles.includes('Administrador'),
          puede_crear_productos: req.user.roles.includes('Vendedor') || req.user.roles.includes('Administrador')
        }
      });
    } catch (error) {
      console.error('Error en test roles:', error);
      res.status(500).json({ error: error.message });
    }
  }
}