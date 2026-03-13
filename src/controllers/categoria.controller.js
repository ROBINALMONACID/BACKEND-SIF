import Categoria from '../models/categoria.model.js';

export class CategoriaController {
  // Get all categories
  static async getAll(req, res) {
    try {
      const categorias = await Categoria.findAll();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new category
  static async create(req, res) {
    try {
      const { nombre_categoria } = req.body;
      if (!nombre_categoria || nombre_categoria.trim() === '') {
        return res.status(400).json({ error: 'Nombre de categoría requerido' });
      }
      const categoria = await Categoria.create({
        nombre_categoria: nombre_categoria.trim(),
        estado: 'activo'
      });
      res.status(201).json(categoria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete category
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Categoria.destroy({ where: { id_categoria: id } });
      if (!deleted) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.json({ message: 'Categoría eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update category
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      await Categoria.update(updateData, { where: { id_categoria: id } });
      const updatedCategoria = await Categoria.findByPk(id);
      res.json(updatedCategoria);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Toggle status
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      const newStatus = categoria.estado === 'activo' ? 'inactivo' : 'activo';
      await Categoria.update({ estado: newStatus }, { where: { id_categoria: id } });
      res.json({ message: `Categoría ${newStatus === 'activo' ? 'activada' : 'desactivada'}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}