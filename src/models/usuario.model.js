import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class Usuario extends Model {}

Usuario.init(
  {
    id_usuario: {
      type: DataTypes.STRING(255),
      primaryKey: true,
    },
    contraseña: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    activado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    idioma: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: 'es',
    },
    url_imagen: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    clave_activacion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    clave_restablecimiento: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fecha_restablecimiento: {
      type: DataTypes.DATE,
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
    modelName: "Usuario",
    tableName: "usuarios",
    timestamps: false,
  }
);

export default Usuario;