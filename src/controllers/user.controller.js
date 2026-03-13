import Usuario from '../models/usuario.model.js';
import UsuarioRol from '../models/usuarioRol.model.js';
import Rol from '../models/rol.model.js';
import sequelize from '../config/connect.db.js';
import bcrypt from 'bcrypt';
import { createError } from '../utils/errorHelper.js';

export class UserController {
  // Get all users with pagination and search
  static async getAll(req, res) {
    try {
      const { page = 1, pageSize = 10, search = '' } = req.query;
      const pageNum = parseInt(page) || 1;
      const limit = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * limit;

      const hasSearch = !!search && search.trim() !== '';
      const whereSql = hasSearch
        ? 'WHERE u.correo_electronico LIKE :search OR u.idioma LIKE :search'
        : '';

      // Get users with their roles using raw query (safe replacements)
      const usersQuery = `
        SELECT u.id_usuario, u.correo_electronico, u.idioma, u.activado,
               COALESCE(r.nombre_rol, '-') as nombre_rol
        FROM usuarios u
        LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN roles r ON ur.id_rol = r.id_rol
        ${whereSql}
        ORDER BY u.fecha_creacion DESC
        LIMIT :limit OFFSET :offset
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT u.id_usuario) as count
        FROM usuarios u
        LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN roles r ON ur.id_rol = r.id_rol
        ${whereSql}
      `;

      const replacements = hasSearch
        ? { search: `%${search}%`, limit, offset }
        : { limit, offset };
      const countReplacements = hasSearch ? { search: `%${search}%` } : {};

      const usersResult = await sequelize.query(usersQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      const countResult = await sequelize.query(countQuery, {
        replacements: countReplacements,
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        data: usersResult,
        total: countResult[0]?.count || 0,
        page: pageNum,
        pageSize: limit,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit)
      });
    } catch (error) {
      console.error('Error en getAll users:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get user by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await Usuario.findByPk(id);
      if (!user) {
        return res.status(404).json(createError('ERR_100'));
      }
      res.json(user);
    } catch (error) {
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Create a new user
  static async create(req, res) {
    try {
      console.log('Datos recibidos para crear usuario:', req.body);

      const { password, id_rol, ...userData } = req.body;

      // Validaciones
      if (!userData.correo_electronico) {
        return res.status(400).json(createError('ERR_103', 'Correo electrónico requerido', 'correo_electronico'));
      }
      if (!/^\S+@\S+\.\S+$/.test(userData.correo_electronico)) {
        return res.status(400).json(createError('ERR_103', null, 'correo_electronico'));
      }
      if (password && password.length < 6) {
        return res.status(400).json(createError('ERR_104', null, 'password'));
      }

      // Verificar si el correo ya existe
      const existeCorreo = await Usuario.findOne({ where: { correo_electronico: userData.correo_electronico } });
      if (existeCorreo) {
        return res.status(409).json(createError('ERR_101', null, 'correo_electronico', { 
          valor_duplicado: userData.correo_electronico 
        }));
      }

      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Map password to contraseña
      const payload = {
        ...userData,
        contraseña: hashedPassword,
        // Generate id_usuario if not provided
        id_usuario: userData.id_usuario || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        activado: userData.activado !== undefined ? userData.activado : true,
        idioma: userData.idioma || 'es'
      };

      console.log('Payload para crear usuario:', payload);

      const user = await Usuario.create(payload);

      // If role is provided, assign it
      if (id_rol) {
        const RolModel = (await import('../models/rol.model.js')).default;
        const roleExists = await RolModel.findByPk(id_rol);
        if (roleExists) {
          const UsuarioRolModel = (await import('../models/usuarioRol.model.js')).default;
          await UsuarioRolModel.create({ id_usuario: user.id_usuario, id_rol });
        }
      }

      console.log('Usuario creado exitosamente:', user.toJSON());
      res.status(201).json(user);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'correo_electronico') {
          return res.status(409).json(createError('ERR_101', null, 'correo_electronico'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Create user with role (for registration)
  static async createWithRole(req, res) {
    const { id_usuario, correo_electronico, idioma, password, id_rol } = req.body;

    try {
      // Validaciones
      if (!correo_electronico) {
        return res.status(400).json(createError('ERR_103', 'Correo electrónico requerido', 'correo_electronico'));
      }
      if (!/^\S+@\S+\.\S+$/.test(correo_electronico)) {
        return res.status(400).json(createError('ERR_103', null, 'correo_electronico'));
      }
      if (!password || password.length < 6) {
        return res.status(400).json(createError('ERR_104', null, 'password'));
      }
      if (!id_rol) {
        return res.status(400).json(createError('ERR_105', null, 'id_rol'));
      }
      if (!id_usuario) {
        return res.status(400).json(createError('ERR_102', null, 'id_usuario'));
      }

      // Verificar si el correo ya existe
      const existeCorreo = await Usuario.findOne({ where: { correo_electronico } });
      if (existeCorreo) {
        return res.status(409).json(createError('ERR_101', null, 'correo_electronico', { 
          valor_duplicado: correo_electronico 
        }));
      }

      // Check if role exists
      const roleExists = await Rol.findByPk(id_rol);
      if (!roleExists) {
        return res.status(404).json(createError('ERR_106', null, 'id_rol'));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await Usuario.create({
        id_usuario,
        contraseña: hashedPassword,
        correo_electronico,
        idioma: idioma || 'es',
        activado: true,
      });

      // Assign role
      await UsuarioRol.create({ id_usuario, id_rol });

      res.status(201).json(user);
    } catch (error) {
      console.error('Error al crear usuario con rol:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'correo_electronico') {
          return res.status(409).json(createError('ERR_101', null, 'correo_electronico'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Update user
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { password, ...updateData } = req.body;
      
      console.log('Actualizando usuario:', id);
      console.log('Datos recibidos:', req.body);
      
      // Verificar que el usuario existe
      const usuarioExistente = await Usuario.findByPk(id);
      if (!usuarioExistente) {
        return res.status(404).json(createError('ERR_100'));
      }
      
      // Si se está actualizando el correo, verificar que no exista
      if (updateData.correo_electronico && updateData.correo_electronico !== usuarioExistente.correo_electronico) {
        const existeCorreo = await Usuario.findOne({ 
          where: { 
            correo_electronico: updateData.correo_electronico,
            id_usuario: { [Op.ne]: id }
          } 
        });
        if (existeCorreo) {
          return res.status(409).json(createError('ERR_101', null, 'correo_electronico', { 
            valor_duplicado: updateData.correo_electronico 
          }));
        }
      }
      
      // Preparar payload de actualización
      const payload = { ...updateData };
      
      // Hash password si se proporciona
      if (password) {
        if (password.length < 6) {
          return res.status(400).json(createError('ERR_104', null, 'password'));
        }
        console.log('Hasheando nueva contraseña...');
        payload.contraseña = await bcrypt.hash(password, 10);
      }
      
      console.log('Payload final:', { ...payload, contraseña: payload.contraseña ? '[HASHED]' : undefined });
      
      await Usuario.update(payload, { where: { id_usuario: id } });
      const updatedUser = await Usuario.findByPk(id);
      
      // Obtener roles del usuario para incluir en respuesta
      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: id },
        include: [{ model: Rol, as: 'rol' }]
      });
      const roles = userRoles.map(ur => ur.rol?.nombre_rol).filter(Boolean);
      
      const { contraseña, ...userData } = updatedUser.toJSON();
      
      console.log('Usuario actualizado exitosamente');
      
      // Devolver usuario CON roles
      res.json({
        success: true,
        user: {
          ...userData,
          roles: roles
        }
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'correo_electronico') {
          return res.status(409).json(createError('ERR_101', null, 'correo_electronico'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Update user with role and optional password
  static async updateWithRole(req, res) {
    const { id } = req.params;
    const { correo_electronico, idioma, activado, url_imagen, id_rol, password } = req.body;

    try {
      // Verificar que el usuario existe
      const usuarioExistente = await Usuario.findByPk(id);
      if (!usuarioExistente) {
        return res.status(404).json(createError('ERR_100'));
      }

      // Validaciones
      if (!correo_electronico) {
        return res.status(400).json(createError('ERR_103', 'Correo electrónico requerido', 'correo_electronico'));
      }
      if (!/^\S+@\S+\.\S+$/.test(correo_electronico)) {
        return res.status(400).json(createError('ERR_103', null, 'correo_electronico'));
      }
      if (!id_rol) {
        return res.status(400).json(createError('ERR_105', null, 'id_rol'));
      }

      // Verificar si el correo ya existe (excluyendo el usuario actual)
      if (correo_electronico !== usuarioExistente.correo_electronico) {
        const existeCorreo = await Usuario.findOne({ 
          where: { 
            correo_electronico,
            id_usuario: { [Op.ne]: id }
          } 
        });
        if (existeCorreo) {
          return res.status(409).json(createError('ERR_101', null, 'correo_electronico', { 
            valor_duplicado: correo_electronico 
          }));
        }
      }

      // Check if role exists
      const roleExists = await Rol.findByPk(id_rol);
      if (!roleExists) {
        return res.status(404).json(createError('ERR_106', null, 'id_rol'));
      }

      // Update user data
      const userPayload = {
        correo_electronico,
        idioma: idioma || 'es',
        activado: activado ? true : false,
        url_imagen: url_imagen || null,
      };

      const [updated] = await Usuario.update(userPayload, { where: { id_usuario: id } });
      if (!updated) {
        return res.status(404).json(createError('ERR_100'));
      }

      // Update password if provided
      if (password) {
        if (password.length < 6) {
          return res.status(400).json(createError('ERR_104', null, 'password'));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await Usuario.update({ contraseña: hashedPassword }, { where: { id_usuario: id } });
      }

      // Update role: delete old and insert new
      await UsuarioRol.destroy({ where: { id_usuario: id } });
      await UsuarioRol.create({ id_usuario: id, id_rol });

      console.log(`Rol actualizado para usuario ${id}: ${roleExists.nombre_rol}`);

      // Obtener usuario actualizado CON roles
      const updatedUser = await Usuario.findByPk(id);
      
      // Obtener roles actualizados
      const userRoles = await UsuarioRol.findAll({
        where: { id_usuario: id },
        include: [{ model: Rol, as: 'rol' }]
      });

      const roles = userRoles.map(ur => ur.rol?.nombre_rol).filter(Boolean);

      // Devolver usuario CON roles para que frontend pueda actualizar
      const { contraseña, ...userData } = updatedUser.toJSON();
      
      res.json({
        success: true,
        user: {
          ...userData,
          roles: roles
        },
        message: 'Usuario y rol actualizados correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar usuario con rol:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'correo_electronico') {
          return res.status(409).json(createError('ERR_101', null, 'correo_electronico'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Delete user
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Usuario.destroy({ where: { id_usuario: id } });
      if (!deleted) {
        return res.status(404).json(createError('ERR_100'));
      }
      res.json({ message: 'Usuario eliminado' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const { id } = req.params;
      console.log('Buscando perfil para usuario:', id);

      // Get user basic info
      const user = await Usuario.findByPk(id, {
        attributes: { exclude: ['contraseña'] }
      });

      console.log('Usuario encontrado:', user ? { id: user.id_usuario, email: user.correo_electronico } : 'No encontrado');

      if (!user) {
        return res.status(404).json(createError('ERR_100'));
      }

      // Get user roles separately using raw query to avoid association issues
      const [userRoles] = await sequelize.query(`
        SELECT r.nombre_rol
        FROM usuario_rol ur
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE ur.id_usuario = ?
        LIMIT 1
      `, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });

      console.log('Consulta de roles ejecutada, resultado:', userRoles);

      let nombreRol = '-';
      if (userRoles && userRoles.nombre_rol) {
        nombreRol = userRoles.nombre_rol;
        console.log('Rol encontrado:', nombreRol);
      }

      const result = { ...user.toJSON(), nombre_rol: nombreRol };
      console.log('Perfil retornado:', { id_usuario: result.id_usuario, nombre_rol: result.nombre_rol });

      res.json(result);
    } catch (error) {
      console.error('Error en getProfile:', error);
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }
}
