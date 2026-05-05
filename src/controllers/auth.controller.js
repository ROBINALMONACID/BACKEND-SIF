import Usuario from '../models/usuario.model.js';
import UsuarioRol from '../models/usuarioRol.model.js';
import Rol from '../models/rol.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createError } from '../utils/errorHelper.js';

const INACTIVE_ACCOUNT_MESSAGE = 'Tu cuenta esta inactiva. Contacta a un administrador.';

export class AuthController {
  // Login
  static async login(req, res) {
    const { email, password } = req.body;

    console.log('Intento de login:', { email, password: '***' });

    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json(createError('ERR_103', 'Correo electronico invalido', 'email'));
      }
      if (!password) {
        return res.status(400).json(createError('ERR_003', 'Contrasena requerida', 'password'));
      }

      const user = await Usuario.findOne({ where: { correo_electronico: email } });
      console.log('Usuario encontrado:', user ? { id: user.id_usuario, email: user.correo_electronico } : 'No encontrado');

      if (!user) {
        return res.status(401).json(createError('ERR_002', 'Usuario no encontrado'));
      }

      const isValidPassword = await bcrypt.compare(password, user.contraseña);
      console.log('Contrasena valida:', isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json(createError('ERR_003', 'Contrasena incorrecta'));
      }

      if (!user.activado) {
        return res.status(403).json(createError('ERR_006', INACTIVE_ACCOUNT_MESSAGE));
      }

      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: user.id_usuario },
        include: [{ model: Rol, as: 'rol' }]
      });

      const roles = userRoles.map((ur) => ur.rol?.nombre_rol).filter(Boolean);

      const token = jwt.sign(
        {
          userId: user.id_usuario,
          id_usuario: user.id_usuario,
          email: user.correo_electronico,
          correo_electronico: user.correo_electronico,
          roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { contraseña, ...userData } = user.toJSON();

      console.log('Login exitoso, retornando token para:', {
        id_usuario: userData.id_usuario,
        correo_electronico: userData.correo_electronico,
        roles
      });

      res.json({
        success: true,
        token,
        user: {
          id: userData.id_usuario,
          id_usuario: userData.id_usuario,
          email: userData.correo_electronico,
          correo_electronico: userData.correo_electronico,
          nombre: `${userData.primer_nombre || ''} ${userData.primer_apellido || ''}`.trim() || 'Usuario',
          roles
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
      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get current user info
  static async me(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json(createError('ERR_005', 'Token de autenticacion invalido'));
      }

      const user = await Usuario.findByPk(req.user.id_usuario);
      if (!user) {
        return res.status(404).json(createError('ERR_100', 'Usuario no encontrado'));
      }
      if (!user.activado) {
        return res.status(403).json(createError('ERR_006', INACTIVE_ACCOUNT_MESSAGE));
      }

      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: user.id_usuario },
        include: [{ model: Rol, as: 'rol' }]
      });

      const roles = userRoles.map((ur) => ur.rol?.nombre_rol).filter(Boolean);
      const { contraseña, ...userData } = user.toJSON();

      console.log('GET /me - Usuario autenticado:', {
        id: userData.id_usuario,
        email: userData.correo_electronico,
        roles
      });

      res.json({
        success: true,
        user: {
          id: userData.id_usuario,
          id_usuario: userData.id_usuario,
          email: userData.correo_electronico,
          correo_electronico: userData.correo_electronico,
          nombre: `${userData.primer_nombre || ''} ${userData.primer_apellido || ''}`.trim() || 'Usuario',
          roles
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
