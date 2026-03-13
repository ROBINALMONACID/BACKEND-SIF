-- Esquema MySQL adaptado para XAMPP
-- Tablas basadas en las proporcionadas, adaptadas a MySQL

-- Función para actualizar fecha_actualizacion (simulada con triggers)
DELIMITER $$

CREATE TRIGGER actualizar_fecha_actualizacion_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
  SET NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER actualizar_fecha_actualizacion_productos
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
  SET NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER actualizar_fecha_actualizacion_clientes
BEFORE UPDATE ON clientes
FOR EACH ROW
BEGIN
  SET NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- Tabla: tipo_documento
CREATE TABLE IF NOT EXISTS tipo_documento (
  id_tipo_documento INT AUTO_INCREMENT PRIMARY KEY,
  abreviatura VARCHAR(10) NOT NULL,
  nombre_documento VARCHAR(150) NOT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'
);

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
   id_usuario VARCHAR(255) PRIMARY KEY,
   contraseña VARCHAR(60),
   correo_electronico VARCHAR(150) UNIQUE NOT NULL,
   activado BOOLEAN NOT NULL DEFAULT TRUE,
   idioma CHAR(2) NOT NULL DEFAULT 'es',
   url_imagen VARCHAR(255),
   clave_activacion VARCHAR(50),
   clave_restablecimiento VARCHAR(50),
   fecha_restablecimiento TIMESTAMP NULL,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: usuario_rol (m:n)
CREATE TABLE IF NOT EXISTS usuario_rol (
  id_usuario VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE
);

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre_categoria VARCHAR(150) NOT NULL UNIQUE,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  codigo_sku VARCHAR(30) UNIQUE NOT NULL,
  nombre_producto VARCHAR(150) NOT NULL,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  presentacion_producto VARCHAR(100),
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  id_categoria INT,
  url_imagen VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  numero_documento VARCHAR(20) UNIQUE NOT NULL,
  correo_electronico VARCHAR(150) UNIQUE,
  primer_nombre VARCHAR(100) NOT NULL,
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100) NOT NULL,
  segundo_apellido VARCHAR(100),
  numero_telefono VARCHAR(20),
  id_usuario VARCHAR(255) UNIQUE,
  id_tipo_documento INT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id_tipo_documento)
);

-- TABLAS REMOVIDAS (factura y productos_facturados) - Ahora se usan recibo_caja y productos_recibo

-- Tabla: recibo_caja
CREATE TABLE IF NOT EXISTS recibo_caja (
   id_recibo_caja INT AUTO_INCREMENT PRIMARY KEY,
   id_cliente INT NOT NULL,
   fecha_recibo_caja TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   numero_recibo_caja INT UNIQUE NOT NULL,
   total DECIMAL(12,2) NOT NULL,
   tipo_pago ENUM('efectivo','tarjeta_credito','tarjeta_debito','otro') NOT NULL,
   FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- Tabla: productos_recibo
CREATE TABLE IF NOT EXISTS productos_recibo (
   id_producto_recibo INT AUTO_INCREMENT PRIMARY KEY,
   id_recibo_caja INT NOT NULL,
   id_producto INT NOT NULL,
   cantidad INT NOT NULL CHECK (cantidad >= 0),
   precio_venta DECIMAL(10,2) NOT NULL,
   FOREIGN KEY (id_recibo_caja) REFERENCES recibo_caja(id_recibo_caja) ON DELETE CASCADE,
   FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
   UNIQUE (id_recibo_caja, id_producto)
);

-- Tabla: cierres_caja
CREATE TABLE IF NOT EXISTS cierres_caja (
   id_cierre_caja INT AUTO_INCREMENT PRIMARY KEY,
   tipo_periodo ENUM('diario', 'semanal', 'quincenal', 'mensual', 'anual') NOT NULL,
   fecha_inicio DATE NOT NULL,
   fecha_fin DATE NOT NULL,
   -- Información general
   turno VARCHAR(50) DEFAULT 'único',
   numero_caja VARCHAR(20) DEFAULT 'Caja 1',
   -- Resumen de ventas
   total_ventas DECIMAL(12,2) NOT NULL DEFAULT 0,
   ventas_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0,
   ventas_tarjeta_credito DECIMAL(12,2) NOT NULL DEFAULT 0,
   ventas_tarjeta_debito DECIMAL(12,2) NOT NULL DEFAULT 0,
   ventas_otros DECIMAL(12,2) NOT NULL DEFAULT 0,
   devoluciones DECIMAL(12,2) NOT NULL DEFAULT 0,
   descuentos DECIMAL(12,2) NOT NULL DEFAULT 0,
   anulaciones DECIMAL(12,2) NOT NULL DEFAULT 0,
   cantidad_recibos INT NOT NULL DEFAULT 0,
   -- Conteo físico de efectivo
   efectivo_contado DECIMAL(12,2) DEFAULT 0,
   diferencia_caja DECIMAL(12,2) DEFAULT 0,
   -- Otros movimientos
   retiros_caja DECIMAL(12,2) NOT NULL DEFAULT 0,
   ingresos_extraordinarios DECIMAL(12,2) NOT NULL DEFAULT 0,
   cambio_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
   -- Información de inventario
   productos_vendidos INT NOT NULL DEFAULT 0,
   ajustes_stock TEXT,
   -- Validación y firma
   firma_cajero BOOLEAN NOT NULL DEFAULT FALSE,
   firma_supervisor BOOLEAN NOT NULL DEFAULT FALSE,
   observaciones TEXT,
   incidencias TEXT,
   -- Usuario y fecha
   id_usuario VARCHAR(255) NOT NULL,
   fecha_cierre TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
   UNIQUE (tipo_periodo, fecha_inicio, fecha_fin, id_usuario)
);

-- Índices para búsquedas
CREATE FULLTEXT INDEX idx_clientes_primer_nombre ON clientes(primer_nombre);
CREATE FULLTEXT INDEX idx_productos_nombre ON productos(nombre_producto);
CREATE FULLTEXT INDEX idx_usuarios_correo ON usuarios(correo_electronico);

-- Datos de ejemplo
INSERT INTO roles (nombre_rol) VALUES ('admin') ON DUPLICATE KEY UPDATE nombre_rol = nombre_rol;
INSERT INTO tipo_documento (abreviatura, nombre_documento) VALUES ('CC','Cédula de ciudadanía') ON DUPLICATE KEY UPDATE abreviatura = abreviatura;