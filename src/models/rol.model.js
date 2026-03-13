import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class Rol extends Model {}

Rol.init(
  {
    id_rol: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre_rol: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Rol",
    tableName: "roles",
    timestamps: false,
  }
);

export default Rol;