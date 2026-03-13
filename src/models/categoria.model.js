import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class Categoria extends Model {}

Categoria.init(
  {
    id_categoria: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre_categoria: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo',
    },
  },
  {
    sequelize,
    modelName: "Categoria",
    tableName: "categorias",
    timestamps: false,
  }
);

export default Categoria;