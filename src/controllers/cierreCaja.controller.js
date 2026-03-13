import CierreCaja from '../models/cierreCaja.model.js';
import ReciboCaja from '../models/reciboCaja.model.js';
import Usuario from '../models/usuario.model.js';
import sequelize from '../config/connect.db.js';
import { Op } from 'sequelize';
import { createError } from '../utils/errorHelper.js';

export class CierreCajaController {
  // Get all closures with filters
  static async getAll(req, res) {
    try {
      console.log('=== GET ALL CIERRES ===');
      console.log('Query params:', req.query);

      const {
        tipo_periodo,
        fecha_inicio,
        fecha_fin,
        id_usuario,
        page = 1,
        pageSize = 10
      } = req.query;

      const whereClause = {};
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;
      const limit = pageSizeNum;

      // Filters
      if (tipo_periodo) whereClause.tipo_periodo = tipo_periodo;
      if (id_usuario) whereClause.id_usuario = id_usuario;
      if (fecha_inicio && fecha_fin) {
        whereClause.fecha_cierre = {
          [Op.gte]: new Date(`${fecha_inicio} 00:00:00`),
          [Op.lte]: new Date(`${fecha_fin} 23:59:59`)
        };
      }

      console.log('Where clause:', whereClause);

      const { count, rows } = await CierreCaja.findAndCountAll({
        where: whereClause,
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'correo_electronico'] }
        ],
        order: [['fecha_cierre', 'DESC']],
        offset,
        limit
      });

      console.log('Total count:', count);
      console.log('Rows returned:', rows.length);

      res.json({
        data: rows,
        totalCount: count,
        currentPage: pageNum,
        pageSize: limit,
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.error('Error getting cierres:', error);
      res.status(500).json(createError('ERR_900', error.message));
    }
  }

  // Get closure by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const cierre = await CierreCaja.findByPk(id);

      if (!cierre) {
        return res.status(404).json(createError('ERR_600', 'Cierre de caja no encontrado'));
      }

      // Get additional statistics for the period
      const recibos = await ReciboCaja.findAll({
        where: {
          fecha_recibo_caja: {
            [Op.gte]: new Date(`${cierre.fecha_inicio} 00:00:00`),
            [Op.lte]: new Date(`${cierre.fecha_fin} 23:59:59`)
          }
        },
        attributes: ['id_recibo_caja', 'total', 'tipo_pago', 'fecha_recibo_caja']
      });

      const resumenPagos = recibos.reduce((acc, recibo) => {
        const tipo = recibo.tipo_pago || 'otro';
        acc[tipo] = (acc[tipo] || 0) + Number(recibo.total || 0);
        return acc;
      }, {});

      res.json({
        ...cierre.toJSON(),
        resumen_pagos: resumenPagos,
        total_recibos: recibos.length
      });
    } catch (error) {
      res.status(500).json(createError('ERR_900', error.message));
    }
  }

  // Get all closures without pagination (for frontend compatibility)
  static async getAllSimple(req, res) {
    try {
      const cierres = await CierreCaja.findAll({
        include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'correo_electronico'] }],
        order: [['fecha_cierre', 'DESC']]
      });
      res.json(cierres);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new closure with comprehensive validation
  static async create(req, res) {
    const { tipo_periodo, fecha_referencia, id_usuario } = req.body;

    // Validations
    if (!tipo_periodo) {
      return res.status(400).json(createError('ERR_601', 'Tipo de período requerido'));
    }
    if (!fecha_referencia) {
      return res.status(400).json(createError('ERR_602', 'Fecha de referencia requerida'));
    }
    if (!id_usuario) {
      return res.status(400).json(createError('ERR_603', 'Usuario requerido'));
    }

    // Validate tipo_periodo
    const tiposValidos = ['diario', 'semanal', 'quincenal', 'mensual', 'anual'];
    if (!tiposValidos.includes(tipo_periodo)) {
      return res.status(400).json(createError('ERR_604', 'Tipo de período inválido', {
        valores_permitidos: tiposValidos
      }));
    }

    try {
      // Verify user exists
      const usuario = await Usuario.findByPk(id_usuario);
      if (!usuario) {
        return res.status(400).json(createError('ERR_605', 'Usuario no encontrado'));
      }

      const fechas = calcularFechasPeriodo(tipo_periodo, fecha_referencia);
      if (!fechas) {
        return res.status(400).json(createError('ERR_606', 'Error al calcular fechas del período'));
      }

      console.log(`Creando cierre ${tipo_periodo} para período: ${fechas.fechaInicio} - ${fechas.fechaFin}`);

      // Check if closure already exists for this period and user
      const existente = await CierreCaja.findOne({
        where: {
          tipo_periodo,
          fecha_inicio: fechas.fechaInicio,
          fecha_fin: fechas.fechaFin,
          id_usuario
        }
      });

      if (existente) {
        return res.status(409).json(createError('ERR_607', 'Ya existe un cierre de caja para este período', {
          tipo_periodo,
          fecha_inicio: fechas.fechaInicio,
          fecha_fin: fechas.fechaFin,
          id_usuario
        }));
      }

      // Calculate totals from receipts in the period
      const recibos = await ReciboCaja.findAll({
        where: {
          fecha_recibo_caja: {
            [Op.gte]: new Date(`${fechas.fechaInicio} 00:00:00`),
            [Op.lte]: new Date(`${fechas.fechaFin} 23:59:59`)
          }
        },
        attributes: ['id_recibo_caja', 'total', 'tipo_pago', 'fecha_recibo_caja']
      });

      console.log(`Encontrados ${recibos.length} recibos en el período`);

      if (recibos.length === 0) {
        return res.status(400).json(createError('ERR_608', 'No hay recibos en el período', {
          tipo_periodo,
          fecha_inicio: fechas.fechaInicio,
          fecha_fin: fechas.fechaFin,
          sugerencia: 'Verifique que existan ventas en el período seleccionado'
        }));
      }

      // Calculate detailed totals by payment type
      const resumenPagos = recibos.reduce((acc, recibo) => {
        const tipo = recibo.tipo_pago || 'otro';
        acc[tipo] = (acc[tipo] || 0) + Number(recibo.total || 0);
        return acc;
      }, {});

      // Calculate product statistics
      const productosVendidosQuery = await sequelize.query(`
        SELECT
          SUM(pr.cantidad) as total_productos,
          COUNT(DISTINCT pr.id_producto) as productos_distintos
        FROM productos_recibo pr
        INNER JOIN recibo_caja rc ON pr.id_recibo_caja = rc.id_recibo_caja
        WHERE rc.fecha_recibo_caja >= ? AND rc.fecha_recibo_caja <= ?
      `, {
        replacements: [`${fechas.fechaInicio} 00:00:00`, `${fechas.fechaFin} 23:59:59`],
        type: sequelize.QueryTypes.SELECT
      });

      const totalVentas = recibos.reduce((sum, recibo) => sum + Number(recibo.total || 0), 0);
      const cantidadRecibos = recibos.length;
      const productosVendidos = productosVendidosQuery[0]?.total_productos || 0;

      // Create closure with information from receipts
      const cierre = await CierreCaja.create({
        tipo_periodo,
        fecha_inicio: fechas.fechaInicio,
        fecha_fin: fechas.fechaFin,
        total_ventas: totalVentas,
        cantidad_recibos: cantidadRecibos,
        id_usuario,
        fecha_cierre: new Date()
      });

      console.log(`Cierre creado exitosamente: ${cierre.id_cierre_caja}`);

      // Return closure response with summary
      res.status(201).json({
        ...cierre.toJSON(),
        resumen: {
          total_ventas: totalVentas,
          cantidad_recibos: cantidadRecibos,
          promedio_por_recibo: cantidadRecibos > 0 ? (totalVentas / cantidadRecibos).toFixed(2) : 0,
          desglose_pagos: resumenPagos,
          productos_vendidos: productosVendidos,
          periodo: `${fechas.fechaInicio} - ${fechas.fechaFin}`
        }
      });

    } catch (error) {
      console.error('Error creando cierre de caja:', error);
      res.status(500).json(createError('ERR_900', 'Error interno del servidor al crear cierre de caja', {
        detalle: error.message
      }));
    }
  }

  // Update closure (limited updates allowed)
  static async update(req, res) {
    try {
      const { id } = req.params;

      // Only allow updating total_ventas or cantidad_recibos if needed
      const updateData = {};
      const { total_ventas, cantidad_recibos } = req.body;
      
      if (total_ventas !== undefined) updateData.total_ventas = total_ventas;
      if (cantidad_recibos !== undefined) updateData.cantidad_recibos = cantidad_recibos;

      const [updated] = await CierreCaja.update(updateData, { where: { id_cierre_caja: id } });

      if (!updated) {
        return res.status(404).json(createError('ERR_600', 'Cierre de caja no encontrado'));
      }

      const updatedCierre = await CierreCaja.findByPk(id, {
        include: [{ model: Usuario, as: 'usuario', attributes: ['id_usuario', 'correo_electronico'] }]
      });

      res.json({
        ...updatedCierre.toJSON(),
        mensaje: 'Cierre de caja actualizado exitosamente'
      });
    } catch (error) {
      res.status(400).json(createError('ERR_900', error.message));
    }
  }

  // Delete closure (only if recent and no dependencies)
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if closure is recent (less than 24 hours old)
      const cierre = await CierreCaja.findByPk(id);
      if (!cierre) {
        return res.status(404).json(createError('ERR_600', 'Cierre de caja no encontrado'));
      }

      const horasDesdeCreacion = (new Date() - new Date(cierre.fecha_cierre)) / (1000 * 60 * 60);
      if (horasDesdeCreacion > 24) {
        return res.status(400).json(createError('ERR_609', 'Cierre muy antiguo para eliminar', {
          horas_antiguedad: Math.round(horasDesdeCreacion),
          limite_horas: 24
        }));
      }

      const deleted = await CierreCaja.destroy({ where: { id_cierre_caja: id } });
      if (!deleted) {
        return res.status(404).json(createError('ERR_600', 'Cierre de caja no encontrado'));
      }

      res.json({
        message: 'Cierre de caja eliminado exitosamente',
        id_cierre_caja: id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

function calcularFechasPeriodo(tipo, fechaRef) {
  const fecha = new Date(fechaRef);
  let fechaInicio, fechaFin;

  switch (tipo) {
    case 'diario':
      fechaInicio = new Date(fecha);
      fechaFin = new Date(fecha);
      break;
    case 'semanal':
      // Lunes a Domingo de la semana que contiene la fecha
      const diaSemana = fecha.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // Si es domingo, ir al lunes anterior
      fechaInicio = new Date(fecha);
      fechaInicio.setDate(fecha.getDate() + diffLunes);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6);
      break;
    case 'quincenal':
      const diaMes = fecha.getDate();
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth();

      if (diaMes <= 15) {
        // Primera quincena: 1-15
        fechaInicio = new Date(anio, mes, 1);
        fechaFin = new Date(anio, mes, 15);
      } else {
        // Segunda quincena: 16-fin de mes
        fechaInicio = new Date(anio, mes, 16);
        fechaFin = new Date(anio, mes + 1, 0); // Último día del mes
      }
      break;
    case 'mensual':
      fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      fechaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      break;
    case 'anual':
      fechaInicio = new Date(fecha.getFullYear(), 0, 1);
      fechaFin = new Date(fecha.getFullYear(), 11, 31);
      break;
    default:
      return null;
  }

  return {
    fechaInicio: fechaInicio.toISOString().split('T')[0],
    fechaFin: fechaFin.toISOString().split('T')[0]
  };
}

