import ReciboCaja from '../models/reciboCaja.model.js';
import Cliente from '../models/cliente.model.js';
import ProductoRecibo from '../models/productoRecibo.model.js';
import Producto from '../models/producto.model.js';
import sequelize from '../config/connect.db.js';
import { Op } from 'sequelize';

export class ReciboCajaController {
  // Get all receipts with optional date filters
  static async getAll(req, res) {
    try {
      const { fechaIni, fechaFin } = req.query;
      const whereClause = {};

      if (fechaIni && fechaFin) {
        whereClause.fecha_recibo_caja = {
          [Op.gte]: new Date(`${fechaIni} 00:00:00`),
          [Op.lte]: new Date(`${fechaFin} 23:59:59`)
        };
      }

      const recibos = await ReciboCaja.findAll({
        where: whereClause,
        include: [{ model: Cliente, as: 'cliente' }],
        order: [['fecha_recibo_caja', 'DESC']]
      });

      res.json(recibos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get receipt by ID with details
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const recibo = await ReciboCaja.findByPk(id, {
        include: [
          { model: Cliente, as: 'cliente' },
          {
            model: ProductoRecibo,
            as: 'productosRecibo',
            include: [{ model: Producto, as: 'producto' }]
          }
        ]
      });

      if (!recibo) {
        return res.status(404).json({ message: 'Recibo no encontrado' });
      }

      res.json(recibo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get last receipt
  static async getLast(req, res) {
    try {
      const lastRecibo = await ReciboCaja.findOne({
        include: [
          { model: Cliente, as: 'cliente' },
          {
            model: ProductoRecibo,
            as: 'productosRecibo',
            include: [{ model: Producto, as: 'producto' }]
          }
        ],
        order: [['numero_recibo_caja', 'DESC']]
      });

      if (!lastRecibo) {
        return res.status(404).json({ message: 'No hay recibos registrados' });
      }

      res.json(lastRecibo);
    } catch (error) {
      console.error('Error obteniendo último recibo:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new receipt with products and update stock
  static async create(req, res) {
    // Aceptar ambos formatos: legacy y nuevo
    let { id_cliente, tipo_pago, productos, metodo_pago, detalles } = req.body;
    
    // Normalizar nombres de campos si vienen con otros nombres
    if (!id_cliente && req.body.cliente) id_cliente = req.body.cliente;
    if (!id_cliente && req.body.id_cliente) id_cliente = req.body.id_cliente;
    
    if (!tipo_pago && metodo_pago) tipo_pago = metodo_pago;
    if (!tipo_pago && req.body.tipo_pago) tipo_pago = req.body.tipo_pago;
    
    if (!productos && detalles) productos = detalles;
    if (!productos && req.body.productos) productos = req.body.productos;
    
    const transaction = await sequelize.transaction();

    console.log('Datos recibidos para crear recibo:', { id_cliente, tipo_pago, productos });

    try {
      // Validations
      if (!id_cliente || !tipo_pago || !productos || productos.length === 0) {
        console.log('Validación fallida:', { id_cliente: !!id_cliente, tipo_pago: !!tipo_pago, productos: !!productos, productosLength: productos?.length });
        await transaction.rollback();
        return res.status(400).json({ error: 'Cliente, tipo de pago y productos son requeridos' });
      }

      // Check if client exists
      const cliente = await Cliente.findByPk(id_cliente, { transaction });
      if (!cliente) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Cliente no encontrado' });
      }

      // Generate automatic receipt number (thread-safe)
      const lastRecibo = await ReciboCaja.findOne({
        order: [['numero_recibo_caja', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const numero_recibo_caja = lastRecibo ? lastRecibo.numero_recibo_caja + 1 : 1;

      console.log('Generando número de recibo automático:', numero_recibo_caja);

      // Validate products and calculate total
      let total = 0;
      const productosNormalizados = [];
      for (const item of productos) {
        const producto = await Producto.findByPk(item.id_producto, { transaction });
        if (!producto) {
          await transaction.rollback();
          return res.status(400).json({ error: `Producto ${item.id_producto} no encontrado` });
        }
        const cantidad = Number(item.cantidad) || 0;
        if (cantidad <= 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `Cantidad inválida para producto ${item.id_producto}` });
        }
        if (producto.stock < cantidad) {
          await transaction.rollback();
          return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre_producto}` });
        }
        const precioBase = item.precio_venta ?? item.precio_unitario ?? producto.precio_unitario;
        const precioVenta = Number(precioBase);
        if (Number.isNaN(precioVenta) || precioVenta < 0) {
          await transaction.rollback();
          return res.status(400).json({ error: `Precio inválido para producto ${item.id_producto}` });
        }
        total += precioVenta * cantidad;
        productosNormalizados.push({
          id_producto: item.id_producto,
          cantidad,
          precio_venta: precioVenta
        });
      }

      // Create receipt
      const recibo = await ReciboCaja.create({
        id_cliente,
        numero_recibo_caja,
        tipo_pago,
        total
      }, { transaction });

      // Create product records
      const productosRecibo = productosNormalizados.map(item => ({
        id_recibo_caja: recibo.id_recibo_caja,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_venta: item.precio_venta
      }));

      await ProductoRecibo.bulkCreate(productosRecibo, { transaction });

      // Update stock
      for (const item of productosNormalizados) {
        await Producto.decrement('stock', {
          by: item.cantidad,
          where: { id_producto: item.id_producto },
          transaction
        });
      }

      await transaction.commit();
      console.log('Recibo creado exitosamente con número:', numero_recibo_caja);

      res.status(201).json({
        ...recibo.toJSON(),
        numero_recibo_caja,
        mensaje: 'Recibo creado exitosamente'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creando recibo:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Update receipt
  static async update(req, res) {
    try {
      const { id } = req.params;
      const [updated] = await ReciboCaja.update(req.body, { where: { id_recibo_caja: id } });
      if (!updated) {
        return res.status(404).json({ message: 'Recibo no encontrado' });
      }
      const updatedRecibo = await ReciboCaja.findByPk(id);
      res.json(updatedRecibo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete receipt
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ReciboCaja.destroy({ where: { id_recibo_caja: id } });
      if (!deleted) {
        return res.status(404).json({ message: 'Recibo no encontrado' });
      }
      res.json({ message: 'Recibo eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Debug endpoint to check request data
  static async debug(req, res) {
    console.log('=== DEBUG RECIBO CAJA ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', req.query);
    console.log('Params:', req.params);

    const { id_cliente, tipo_pago, productos } = req.body;

    const debugInfo = {
      received: { id_cliente, tipo_pago, productos },
      validations: {
        hasIdCliente: !!id_cliente,
        hasTipoPago: !!tipo_pago,
        hasProductos: !!productos,
        productosLength: productos?.length || 0,
        productosValid: productos?.every(p => p.id_producto && p.cantidad) || false
      }
    };

    console.log('Debug info:', debugInfo);

    res.json({
      message: 'Debug info logged',
      debug: debugInfo,
      timestamp: new Date().toISOString()
    });
  }

  // Get receipt items
  static async getItems(req, res) {
    try {
      const { id } = req.params;

      const recibo = await ReciboCaja.findByPk(id, {
        include: [
          {
            model: ProductoRecibo,
            as: 'productosRecibo',
            include: [{
              model: Producto,
              as: 'producto',
              attributes: ['id_producto', 'nombre_producto', 'codigo_sku', 'precio_unitario', 'url_imagen']
            }]
          }
        ]
      });

      if (!recibo) {
        return res.status(404).json({ error: 'Recibo no encontrado' });
      }

      const items = recibo.productosRecibo.map(item => ({
        id_producto: item.producto.id_producto,
        nombre_producto: item.producto.nombre_producto,
        codigo_sku: item.producto.codigo_sku,
        precio_unitario: item.producto.precio_unitario,
        url_imagen: item.producto.url_imagen,
        cantidad: item.cantidad,
        precio_venta: item.precio_venta,
        subtotal: (item.cantidad * item.precio_venta).toFixed(2)
      }));

      res.json({
        id_recibo_caja: recibo.id_recibo_caja,
        numero_recibo_caja: recibo.numero_recibo_caja,
        items: items,
        total: recibo.total
      });

    } catch (error) {
      console.error('Error obteniendo items del recibo:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Print receipt endpoint
  static async print(req, res) {
    try {
      const { id } = req.params;

      const recibo = await ReciboCaja.findByPk(id, {
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_documento']
          },
          {
            model: ProductoRecibo,
            as: 'productosRecibo',
            include: [{
              model: Producto,
              as: 'producto',
              attributes: ['nombre_producto', 'codigo_sku']
            }]
          }
        ]
      });

      if (!recibo) {
        return res.status(404).json({ error: 'Recibo no encontrado' });
      }

      // Format data for printing
      const printData = {
        numero_recibo: recibo.numero_recibo_caja,
        fecha: recibo.fecha_recibo_caja,
        cliente: {
          nombre_completo: `${recibo.cliente.primer_nombre} ${recibo.cliente.segundo_nombre || ''} ${recibo.cliente.primer_apellido} ${recibo.cliente.segundo_apellido || ''}`.trim(),
          documento: recibo.cliente.numero_documento
        },
        productos: recibo.productosRecibo.map(item => ({
          nombre: item.producto.nombre_producto,
          sku: item.producto.codigo_sku,
          cantidad: item.cantidad,
          precio_unitario: item.precio_venta,
          subtotal: (item.cantidad * item.precio_venta).toFixed(2)
        })),
        total: recibo.total,
        tipo_pago: recibo.tipo_pago
      };

      res.json({
        success: true,
        printData,
        message: 'Datos de recibo preparados para impresión'
      });

    } catch (error) {
      console.error('Error preparing receipt for printing:', error);
      res.status(500).json({
        error: 'Error al preparar recibo para impresión',
        detalle: error.message
      });
    }
  }
}
