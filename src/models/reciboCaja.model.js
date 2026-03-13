import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class ReciboCaja extends Model {}

ReciboCaja.init(
  {
    id_recibo_caja: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id_cliente',
      },
    },
    fecha_recibo_caja: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    numero_recibo_caja: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    tipo_pago: {
      type: DataTypes.ENUM('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'otro'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ReciboCaja",
    tableName: "recibo_caja",
    timestamps: false,
  }
);

export default ReciboCaja;