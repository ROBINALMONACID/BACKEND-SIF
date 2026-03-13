import sequelize from "../config/connect.db.js";
import { Model, DataTypes } from "sequelize";

class UsuarioRol extends Model {}

UsuarioRol.init(
  {
    id_usuario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'usuarios',
        key: 'id_usuario',
      },
    },
    id_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id_rol',
      },
    },
  },
  {
    sequelize,
    modelName: "UsuarioRol",
    tableName: "usuario_rol",
    timestamps: false,
  }
);

export default UsuarioRol;