import Cliente from '../models/cliente.model.js';
import TipoDocumento from '../models/tipoDocumento.model.js';
import { Op } from 'sequelize';
import { createError } from '../utils/errorHelper.js';

export class ClienteController {
  // Get all clients with pagination and search
  static async getAll(req, res) {
    try {
      const { page = 1, pageSize = 10, search = '' } = req.query;
      const offset = (page - 1) * pageSize;
      const limit = parseInt(pageSize);

      const whereClause = search ? {
        [Op.or]: [
          { primer_nombre: { [Op.like]: `%${search}%` } },
          { segundo_nombre: { [Op.like]: `%${search}%` } },
          { primer_apellido: { [Op.like]: `%${search}%` } },
          { segundo_apellido: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
          { correo_electronico: { [Op.like]: `%${search}%` } }
        ]
      } : {};

      const { count, rows } = await Cliente.findAndCountAll({
        where: whereClause,
        offset,
        limit,
        attributes: ['id_cliente', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_documento', 'correo_electronico', 'numero_telefono']
      });

      // Add full name
      const clientes = rows.map(cliente => ({
        ...cliente.toJSON(),
        nombre_completo: `${cliente.primer_nombre} ${cliente.segundo_nombre || ''} ${cliente.primer_apellido} ${cliente.segundo_apellido || ''}`.trim()
      }));

      res.json({
        data: clientes,
        totalCount: count,
        currentPage: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all clients without pagination (for frontend compatibility)
  static async getAllSimple(req, res) {
    try {
      const { search = '' } = req.query;

      console.log('Obteniendo clientes sin paginación, búsqueda:', search);

      const whereClause = search ? {
        [Op.or]: [
          { primer_nombre: { [Op.like]: `%${search}%` } },
          { segundo_nombre: { [Op.like]: `%${search}%` } },
          { primer_apellido: { [Op.like]: `%${search}%` } },
          { segundo_apellido: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
          { correo_electronico: { [Op.like]: `%${search}%` } }
        ]
      } : {};

      const clientes = await Cliente.findAll({
        where: whereClause,
        attributes: ['id_cliente', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_documento', 'correo_electronico', 'numero_telefono']
      });

      // Add full name
      const clientesConNombreCompleto = clientes.map(cliente => ({
        ...cliente.toJSON(),
        nombre_completo: `${cliente.primer_nombre} ${cliente.segundo_nombre || ''} ${cliente.primer_apellido} ${cliente.segundo_apellido || ''}`.trim()
      }));

      console.log('Clientes encontrados:', clientesConNombreCompleto.length);

      res.json(clientesConNombreCompleto);
    } catch (error) {
      console.error('Error en getAllSimple clientes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get client by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      console.log('Buscando cliente con ID:', id);

      const cliente = await Cliente.findByPk(id);
      console.log('Resultado de búsqueda:', cliente ? 'Encontrado' : 'No encontrado');

      if (!cliente) {
        console.log('Cliente no encontrado para ID:', id);
        return res.status(404).json(createError('ERR_200'));
      }

      const clienteData = cliente.toJSON();
      console.log('Cliente encontrado:', { id: clienteData.id_cliente, nombre: clienteData.primer_nombre });

      res.json(clienteData);
    } catch (error) {
      console.error('Error en getById cliente:', error);
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Create a new client
  static async create(req, res) {
    try {
      console.log('Datos recibidos para crear cliente:', req.body);

      const {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        numero_documento,
        correo_electronico,
        numero_telefono,
        id_tipo_documento
      } = req.body;

      // Validaciones de campos requeridos
      if (!primer_nombre) {
        return res.status(400).json(createError('ERR_201', null, 'primer_nombre'));
      }
      if (!primer_apellido) {
        return res.status(400).json(createError('ERR_202', null, 'primer_apellido'));
      }
      if (!numero_documento) {
        return res.status(400).json(createError('ERR_203', null, 'numero_documento'));
      }
      if (!correo_electronico) {
        return res.status(400).json(createError('ERR_205', null, 'correo_electronico'));
      }
      if (!numero_telefono) {
        return res.status(400).json(createError('ERR_207', null, 'numero_telefono'));
      }
      if (!id_tipo_documento) {
        return res.status(400).json(createError('ERR_209', null, 'id_tipo_documento'));
      }

      // Validación de formato de correo
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_electronico)) {
        return res.status(400).json(createError('ERR_206', null, 'correo_electronico'));
      }

      // Validación de formato de teléfono
      if (!/^\+?[0-9\s-]{7,15}$/.test(numero_telefono)) {
        return res.status(400).json(createError('ERR_208', null, 'numero_telefono'));
      }

      // Verificar si el tipo de documento existe
      const tipoDoc = await TipoDocumento.findByPk(id_tipo_documento);
      if (!tipoDoc) {
        return res.status(404).json(createError('ERR_210', null, 'id_tipo_documento'));
      }

      // Verificar si el número de documento ya existe
      const existeDocumento = await Cliente.findOne({ where: { numero_documento } });
      if (existeDocumento) {
        return res.status(409).json(createError('ERR_204', null, 'numero_documento', { 
          valor_duplicado: numero_documento 
        }));
      }

      // Verificar si el número de teléfono ya existe
      const existeTelefono = await Cliente.findOne({ where: { numero_telefono } });
      if (existeTelefono) {
        return res.status(409).json(createError('ERR_211', null, 'numero_telefono', { 
          valor_duplicado: numero_telefono 
        }));
      }

      const payload = {
        primer_nombre,
        segundo_nombre: segundo_nombre || null,
        primer_apellido,
        segundo_apellido: segundo_apellido || null,
        numero_documento,
        correo_electronico,
        numero_telefono,
        id_tipo_documento: Number(id_tipo_documento),
      };

      console.log('Payload para crear cliente:', payload);

      const cliente = await Cliente.create(payload);
      console.log('Cliente creado exitosamente:', cliente.toJSON());
      res.status(201).json(cliente);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      
      // Manejar errores de Sequelize por duplicados (por si acaso)
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'numero_documento') {
          return res.status(409).json(createError('ERR_204', null, 'numero_documento'));
        }
        if (field === 'numero_telefono') {
          return res.status(409).json(createError('ERR_211', null, 'numero_telefono'));
        }
        if (field === 'correo_electronico') {
          return res.status(409).json(createError('ERR_212', null, 'correo_electronico', {
            valor_duplicado: error.errors[0]?.value
          }));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

  // Update client
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        numero_documento,
        correo_electronico,
        numero_telefono,
        id_tipo_documento
      } = req.body;

      // Verificar que el cliente existe
      const clienteExistente = await Cliente.findByPk(id);
      if (!clienteExistente) {
        return res.status(404).json(createError('ERR_200'));
      }

      // Validaciones de campos requeridos
      if (!primer_nombre) {
        return res.status(400).json(createError('ERR_201', null, 'primer_nombre'));
      }
      if (!primer_apellido) {
        return res.status(400).json(createError('ERR_202', null, 'primer_apellido'));
      }
      if (!numero_documento) {
        return res.status(400).json(createError('ERR_203', null, 'numero_documento'));
      }
      if (!correo_electronico) {
        return res.status(400).json(createError('ERR_205', null, 'correo_electronico'));
      }
      if (!numero_telefono) {
        return res.status(400).json(createError('ERR_207', null, 'numero_telefono'));
      }
      if (!id_tipo_documento) {
        return res.status(400).json(createError('ERR_209', null, 'id_tipo_documento'));
      }

      // Validación de formato de correo
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_electronico)) {
        return res.status(400).json(createError('ERR_206', null, 'correo_electronico'));
      }

      // Validación de formato de teléfono
      if (!/^\+?[0-9\s-]{7,15}$/.test(numero_telefono)) {
        return res.status(400).json(createError('ERR_208', null, 'numero_telefono'));
      }

      // Verificar si el tipo de documento existe
      const tipoDoc = await TipoDocumento.findByPk(id_tipo_documento);
      if (!tipoDoc) {
        return res.status(404).json(createError('ERR_210', null, 'id_tipo_documento'));
      }

      // Verificar si el número de documento ya existe (excluyendo el cliente actual)
      const existeDocumento = await Cliente.findOne({ 
        where: { 
          numero_documento,
          id_cliente: { [Op.ne]: id }
        } 
      });
      if (existeDocumento) {
        return res.status(409).json(createError('ERR_204', null, 'numero_documento', { 
          valor_duplicado: numero_documento 
        }));
      }

      // Verificar si el número de teléfono ya existe (excluyendo el cliente actual)
      const existeTelefono = await Cliente.findOne({ 
        where: { 
          numero_telefono,
          id_cliente: { [Op.ne]: id }
        } 
      });
      if (existeTelefono) {
        return res.status(409).json(createError('ERR_211', null, 'numero_telefono', { 
          valor_duplicado: numero_telefono 
        }));
      }

      const payload = {
        primer_nombre,
        segundo_nombre: segundo_nombre || null,
        primer_apellido,
        segundo_apellido: segundo_apellido || null,
        numero_documento,
        correo_electronico,
        numero_telefono,
        id_tipo_documento: Number(id_tipo_documento),
      };

      const [updated] = await Cliente.update(payload, { where: { id_cliente: id } });
      if (!updated) {
        return res.status(404).json(createError('ERR_200'));
      }
      const updatedCliente = await Cliente.findByPk(id);
      res.json(updatedCliente);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      
      // Manejar errores de Sequelize por duplicados
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        if (field === 'numero_documento') {
          return res.status(409).json(createError('ERR_204', null, 'numero_documento'));
        }
        if (field === 'numero_telefono') {
          return res.status(409).json(createError('ERR_211', null, 'numero_telefono'));
        }
      }
      
      res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
    }
  }

}