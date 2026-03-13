import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class ProductoRecibo extends Model {}

ProductoRecibo.init(
  {
    id_producto_recibo: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_recibo_caja: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'recibo_caja',
        key: 'id_recibo_caja',
      },
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos',
        key: 'id_producto',
      },
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ProductoRecibo",
    tableName: "productos_recibo",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['id_recibo_caja', 'id_producto'],
      },
    ],
  }
);

export default ProductoRecibo;