import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class CierreCaja extends Model {}

CierreCaja.init(
  {
    id_cierre_caja: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tipo_periodo: {
      type: DataTypes.ENUM('diario', 'semanal', 'quincenal', 'mensual', 'anual'),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_ventas: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cantidad_recibos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    id_usuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
    fecha_cierre: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "CierreCaja",
    tableName: "cierres_caja",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['tipo_periodo', 'fecha_inicio', 'fecha_fin', 'id_usuario'],
      },
    ],
  }
);

export default CierreCaja;