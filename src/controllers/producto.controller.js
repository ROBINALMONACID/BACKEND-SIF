import Producto from '../models/producto.model.js';
import Categoria from '../models/categoria.model.js';
import { Op } from 'sequelize';
import { createError } from '../utils/errorHelper.js';

export class ProductoController {
  // Get all products with pagination and search
  static async getAll(req, res) {
    try {
      const { page, pageSize, search = '' } = req.query;

      // Si no vienen parámetros de paginación, devolver TODOS los productos
      const hasPagination = page !== undefined || pageSize !== undefined;

      let offset = 0;
      let limit = null; // null significa sin límite en Sequelize

      if (hasPagination) {
        // Parse and validate parameters
        const pageNum = parseInt(page) || 1;
        const pageSizeNum = parseInt(pageSize) || 10;

        // Ensure positive values
        const validPage = Math.max(1, pageNum);
        const validPageSize = Math.max(1, Math.min(1000, pageSizeNum)); // Max 1000 items per page

        offset = (validPage - 1) * validPageSize;
        limit = validPageSize;

        console.log('Parámetros de paginación:', { page: validPage, pageSize: validPageSize, offset, limit, search });
      } else {
        console.log('Sin paginación - Devolviendo TODOS los productos');
      }

      const whereClause = search ? {
        [Op.or]: [
          { nombre_producto: { [Op.like]: `%${search}%` } },
          { codigo_sku: { [Op.like]: `%${search}%` } }
        ]
      } : {};

      const findOptions = {
        where: whereClause,
        include: [{ model: Categoria, as: 'categoria', required: false }],
        attributes: ['id_producto', 'codigo_sku', 'nombre_producto', 'stock', 'precio_unitario', 'id_categoria', 'presentacion_producto', 'estado', 'url_imagen']
      };

      // Agregar paginación solo si se proporcionaron parámetros
      if (hasPagination) {
        findOptions.offset = offset;
        findOptions.limit = limit;
      }

      const { count, rows } = await Producto.findAndCountAll(findOptions);

      console.log('Resultado de consulta:', { count, rowsCount: rows.length });
      
      // Log para diagnóstico - ver estructura de categoría
      if (rows.length > 0) {
        console.log('Estructura del primer producto:', JSON.stringify(rows[0], null, 2));
      }

      // Respuesta diferente según si hay paginación o no
      if (hasPagination) {
        res.json({
          data: rows,
          totalCount: count,
          currentPage: parseInt(page),
          pageSize: limit,
          totalPages: Math.ceil(count / limit)
        });
      } else {
        res.json({
          data: rows,
          totalCount: count,
          message: 'Todos los productos sin paginación'
        });
      }
    } catch (error) {
      console.error('Error en getAll productos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all products without pagination (for frontend compatibility)
  static async getAllSimple(req, res) {
    try {
      const { search = '' } = req.query;

      console.log('Obteniendo productos sin paginación, búsqueda:', search);

      const whereClause = search ? {
        [Op.or]: [
          { nombre_producto: { [Op.like]: `%${search}%` } },
          { codigo_sku: { [Op.like]: `%${search}%` } }
        ]
      } : {};

      const productos = await Producto.findAll({
        where: whereClause,
        include: [{ model: Categoria, as: 'categoria', required: false }],
        attributes: ['id_producto', 'codigo_sku', 'nombre_producto', 'stock', 'precio_unitario', 'id_categoria', 'presentacion_producto', 'estado', 'url_imagen']
      });

      console.log('Productos encontrados:', productos.length);
      
      // Log para diagnóstico - ver estructura de categoría
      if (productos.length > 0) {
        console.log('Estructura del primer producto (getAllSimple):', JSON.stringify(productos[0], null, 2));
      }

      res.json(productos);
    } catch (error) {
      console.error('Error en getAllSimple productos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get product by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const producto = await Producto.findByPk(id, {
        include: [{ model: Categoria, as: 'categoria', required: false }],
        attributes: ['id_producto', 'codigo_sku', 'nombre_producto', 'stock', 'precio_unitario', 'id_categoria', 'presentacion_producto', 'estado', 'url_imagen', 'fecha_creacion', 'fecha_actualizacion']
      });

      if (!producto) {
        return res.status(404).json(createError('ERR_300'));
      }

      // Log para diagnóstico
      console.log('Producto obtenido por ID:', JSON.stringify(producto, null, 2));

      res.json(producto);
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json(createError('ERR_900', error.message));
    }
  }

  // Create a new product
  static async create(req, res) {
    try {
      const {
        codigo_sku,
        nombre_producto,
        presentacion,
        stock,
        precio_unitario,
        fecha_vencimiento,
        id_categoria,
        activo,
        imagen_url
      } = req.body;

      // Validaciones de campos requeridos
      if (!codigo_sku) {
        return res.status(400).json(createError('ERR_301', null, 'codigo_sku'));
      }
      if (!nombre_producto) {
        return res.status(400).json(createError('ERR_303', null, 'nombre_producto'));
      }
      if (!id_categoria) {
        return res.status(400).json(createError('ERR_306', null, 'id_categoria'));
      }

      // Validaciones de formato
      if (stock != null && (isNaN(Number(stock)) || Number(stock) < 0)) {
        return res.status(400).json(createError('ERR_304', null, 'stock'));
      }
      if (precio_unitario != null && (isNaN(Number(precio_unitario)) || Number(precio_unitario) < 0)) {
        return res.status(400).json(createError('ERR_305', null, 'precio_unitario'));
      }

      // Verificar si la categoría existe
      const categoria = await Categoria.findByPk(id_categoria);
      if (!categoria) {
        return res.status(404).json(createError('ERR_307', null, 'id_categoria'));
      }

      // Verificar si el SKU ya existe
      const existeSKU = await Producto.findOne({ where: { codigo_sku } });
      if (existeSKU) {
        return res.status(409).json(createError('ERR_302', null, 'codigo_sku', { 
          valor_duplicado: codigo_sku 
        }));
      }

      const payload = {
        codigo_sku,
        nombre_producto,
        presentacion_producto: presentacion || null,
        stock: stock || 0,
        precio_unitario: precio_unitario || 0,
        fecha_vencimiento: fecha_vencimiento || null,
        id_categoria,
        estado: activo ? 'activo' : 'inactivo',
        url_imagen: imagen_url || null,
      };

      const producto = await Producto.create(payload);
      res.status(201).json(producto);
    } catch (error) {
      console.error('Error al crear producto:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'codigo_sku') {
          return res.status(409).json(createError('ERR_302', null, 'codigo_sku'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Update product
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      // Log para diagnosticar qué está llegando
      console.log('UPDATE - Body recibido:', JSON.stringify(req.body, null, 2));
      
      const {
        codigo_sku,
        nombre_producto,
        stock,
        presentacion,
        presentacion_producto,
        precio_unitario,
        id_categoria,
        estado,
        url_imagen
      } = req.body;

      // Verificar que el producto existe
      const productoExistente = await Producto.findByPk(id);
      if (!productoExistente) {
        return res.status(404).json(createError('ERR_300'));
      }

      // Validaciones de campos requeridos
      if (!codigo_sku) {
        return res.status(400).json(createError('ERR_301', null, 'codigo_sku'));
      }
      if (!nombre_producto) {
        return res.status(400).json(createError('ERR_303', null, 'nombre_producto'));
      }

      // Validaciones de formato
      if (stock != null && (isNaN(Number(stock)) || Number(stock) < 0)) {
        return res.status(400).json(createError('ERR_304', null, 'stock'));
      }
      if (precio_unitario != null && (isNaN(Number(precio_unitario)) || Number(precio_unitario) < 0)) {
        return res.status(400).json(createError('ERR_305', null, 'precio_unitario'));
      }

      // Verificar si la categoría existe (si se proporciona)
      if (id_categoria) {
        const categoria = await Categoria.findByPk(id_categoria);
        if (!categoria) {
          return res.status(404).json(createError('ERR_307', null, 'id_categoria'));
        }
      }

      // Verificar si el SKU ya existe (excluyendo el producto actual)
      const existeSKU = await Producto.findOne({ 
        where: { 
          codigo_sku,
          id_producto: { [Op.ne]: id }
        } 
      });
      if (existeSKU) {
        return res.status(409).json(createError('ERR_302', null, 'codigo_sku', { 
          valor_duplicado: codigo_sku 
        }));
      }

      // Soportar ambos nombres de campo (presentacion y presentacion_producto)
      const presentacionFinal = presentacion_producto !== undefined ? presentacion_producto : presentacion;

      const payload = {
        codigo_sku,
        nombre_producto
      };

      if (stock !== undefined) payload.stock = Number(stock);
      if (precio_unitario !== undefined) payload.precio_unitario = Number(precio_unitario);
      if (presentacionFinal !== undefined) {
        payload.presentacion_producto =
          presentacionFinal !== null && presentacionFinal !== '' ? presentacionFinal : null;
      }
      if (id_categoria !== undefined) {
        payload.id_categoria = id_categoria ? Number(id_categoria) : null;
      }
      if (estado !== undefined) payload.estado = estado;
      if (url_imagen !== undefined) payload.url_imagen = url_imagen;
      
      console.log('UPDATE - Payload a enviar:', JSON.stringify(payload, null, 2));

      // Actualizar producto
      await Producto.update(payload, { where: { id_producto: id } });
      
      // Obtener producto actualizado con categoría
      const updatedProducto = await Producto.findByPk(id, {
        include: [{ model: Categoria, as: 'categoria' }]
      });
      
      res.json(updatedProducto);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'codigo_sku') {
          return res.status(409).json(createError('ERR_302', null, 'codigo_sku'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Delete product
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Producto.destroy({ where: { id_producto: id } });
      if (!deleted) {
        return res.status(404).json(createError('ERR_300'));
      }
      res.json({ message: 'Producto eliminado' });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }
}
