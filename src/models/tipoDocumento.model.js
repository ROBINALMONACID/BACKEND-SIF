import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class TipoDocumento extends Model {}

TipoDocumento.init(
  {
    id_tipo_documento: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    abreviatura: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    nombre_documento: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo',
    },
  },
  {
    sequelize,
    modelName: "TipoDocumento",
    tableName: "tipo_documento",
    timestamps: false,
  }
);

export default TipoDocumento;