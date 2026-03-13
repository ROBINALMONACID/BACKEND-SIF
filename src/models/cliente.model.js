import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class Cliente extends Model {}

Cliente.init(
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
    },
    primer_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    segundo_nombre: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    primer_apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    segundo_apellido: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    numero_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    id_usuario: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
    id_tipo_documento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tipo_documento',
        key: 'id_tipo_documento',
      },
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
    modelName: "Cliente",
    tableName: "clientes",
    timestamps: false,
  }
);

export default Cliente;