import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class Producto extends Model {}

Producto.init(
  {
    id_producto: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo_sku: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    nombre_producto: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    presentacion_producto: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo',
    },
    id_categoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categorias',
        key: 'id_categoria',
      },
    },
    url_imagen: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Producto",
    tableName: "productos",
    timestamps: false,
  }
);

export default Producto;