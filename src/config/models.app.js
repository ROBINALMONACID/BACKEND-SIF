import sequelize from "../config/connect.db.js";
import TipoDocumento from "../models/tipoDocumento.model.js";
import Rol from "../models/rol.model.js";
import Usuario from "../models/usuario.model.js";
import UsuarioRol from "../models/usuarioRol.model.js";
import Categoria from "../models/categoria.model.js";
import Producto from "../models/producto.model.js";
import Cliente from "../models/cliente.model.js";
import ReciboCaja from "../models/reciboCaja.model.js";
import ProductoRecibo from "../models/productoRecibo.model.js";
import CierreCaja from "../models/cierreCaja.model.js";

export const modelsApp = function initModels(select) {
    // Always define associations
    // UsuarioRol associations
    UsuarioRol.belongsTo(Usuario, { foreignKey: 'id_usuario' });
    UsuarioRol.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' });
    Usuario.hasMany(UsuarioRol, { foreignKey: 'id_usuario' });
    Rol.hasMany(UsuarioRol, { foreignKey: 'id_rol' });

    // Producto associations
    Producto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });
    Categoria.hasMany(Producto, { foreignKey: 'id_categoria' });

    // Cliente associations
    Cliente.belongsTo(Usuario, { foreignKey: 'id_usuario' });
    Cliente.belongsTo(TipoDocumento, { foreignKey: 'id_tipo_documento' });
    Usuario.hasOne(Cliente, { foreignKey: 'id_usuario' });
    TipoDocumento.hasMany(Cliente, { foreignKey: 'id_tipo_documento' });

    // ReciboCaja associations
    ReciboCaja.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
    Cliente.hasMany(ReciboCaja, { foreignKey: 'id_cliente' });

    // ProductoRecibo associations
    ProductoRecibo.belongsTo(ReciboCaja, { foreignKey: 'id_recibo_caja', as: 'reciboCaja' });
    ProductoRecibo.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
    ReciboCaja.hasMany(ProductoRecibo, { foreignKey: 'id_recibo_caja', as: 'productosRecibo' });
    Producto.hasMany(ProductoRecibo, { foreignKey: 'id_producto' });

    // CierreCaja associations
    CierreCaja.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
    Usuario.hasMany(CierreCaja, { foreignKey: 'id_usuario' });

    if (select) {
        sequelize.sync();
    }
}