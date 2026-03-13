// Sistema de códigos de error estandarizados para VetShop API

export const ERROR_CODES = {
  // Autenticación (ERR_001 - ERR_099)
  ERR_001: 'Credenciales inválidas',
  ERR_002: 'Usuario no encontrado',
  ERR_003: 'Contraseña incorrecta',
  ERR_004: 'Token expirado',
  ERR_005: 'Token inválido',
  ERR_006: 'Acceso no autorizado',
  ERR_007: 'Sesión expirada',

  // Usuarios (ERR_100 - ERR_199)
  ERR_100: 'Usuario no encontrado',
  ERR_101: 'Correo electrónico ya existe',
  ERR_102: 'ID de usuario requerido',
  ERR_103: 'Correo electrónico inválido',
  ERR_104: 'Contraseña muy corta (mínimo 6 caracteres)',
  ERR_105: 'Rol requerido',
  ERR_106: 'Rol no encontrado',
  ERR_107: 'Usuario ya tiene rol asignado',

  // Clientes (ERR_200 - ERR_299)
  ERR_200: 'Cliente no encontrado',
  ERR_201: 'Primer nombre requerido',
  ERR_202: 'Primer apellido requerido',
  ERR_203: 'Número de documento requerido',
  ERR_204: 'Número de documento ya existe',
  ERR_205: 'Correo electrónico requerido',
  ERR_206: 'Correo electrónico inválido',
  ERR_207: 'Número de teléfono requerido',
  ERR_208: 'Número de teléfono inválido',
  ERR_209: 'Tipo de documento requerido',
  ERR_210: 'Tipo de documento no encontrado',
  ERR_211: 'Número de teléfono ya existe',
  ERR_212: 'Correo electrónico ya existe',

  // Productos (ERR_300 - ERR_399)
  ERR_300: 'Producto no encontrado',
  ERR_301: 'Código SKU requerido',
  ERR_302: 'Código SKU ya existe',
  ERR_303: 'Nombre del producto requerido',
  ERR_304: 'Stock inválido (debe ser >= 0)',
  ERR_305: 'Precio unitario inválido (debe ser >= 0)',
  ERR_306: 'Categoría requerida',
  ERR_307: 'Categoría no encontrada',

  // Categorías (ERR_400 - ERR_499)
  ERR_400: 'Categoría no encontrada',
  ERR_401: 'Archivo no recibido',
  ERR_402: 'Tipo de archivo no permitido',
  ERR_403: 'Archivo muy grande (máximo 5MB)',
  ERR_404: 'Error al guardar archivo',
  ERR_405: 'Nombre de categoría ya existe',

  // Recibos de Caja (ERR_500 - ERR_599)
  ERR_500: 'Recibo no encontrado',
  ERR_501: 'Cliente requerido',
  ERR_502: 'Tipo de pago requerido',
  ERR_503: 'Productos requeridos',
  ERR_504: 'Cliente no encontrado',
  ERR_505: 'Producto no encontrado',
  ERR_506: 'Stock insuficiente',
  ERR_507: 'Error en transacción de stock',
  ERR_508: 'Error al generar número de recibo',

  // Cierres de Caja (ERR_600 - ERR_699)
  ERR_600: 'Cierre de caja no encontrado',
  ERR_601: 'Tipo de período requerido',
  ERR_602: 'Fecha de referencia requerida',
  ERR_603: 'Usuario requerido',
  ERR_604: 'Tipo de período inválido',
  ERR_605: 'Usuario no encontrado',
  ERR_606: 'Error al calcular fechas del período',
  ERR_607: 'Ya existe cierre para este período',
  ERR_608: 'No hay recibos en el período',
  ERR_609: 'Cierre muy antiguo para eliminar (>24h)',

  // Base de Datos (ERR_700 - ERR_799)
  ERR_700: 'Error de conexión a base de datos',
  ERR_701: 'Error en consulta SQL',
  ERR_702: 'Violación de restricción de integridad',
  ERR_703: 'Violación de clave única',
  ERR_704: 'Error en transacción',
  ERR_705: 'Timeout de base de datos',

  // Validación y Archivos (ERR_800 - ERR_899)
  ERR_800: 'Faltan datos obligatorios',
  ERR_801: 'No se proporcionó archivo',
  ERR_802: 'Formato de imagen inválido',
  ERR_803: 'Archivo muy grande',
  ERR_804: 'Tipo de dato incorrecto',
  ERR_805: 'Fecha inválida',
  ERR_806: 'Número inválido',
  ERR_807: 'Formato de datos inválido',
  ERR_808: 'Longitud de campo excedida',
  ERR_809: 'Valor fuera de rango',

  // Sistema (ERR_900 - ERR_999)
  ERR_900: 'Error interno del servidor',
  ERR_901: 'Servicio no disponible',
  ERR_902: 'Error de configuración',
  ERR_903: 'Memoria insuficiente',
  ERR_904: 'Error de archivo',
  ERR_905: 'Error de red'
};

/**
 * Crea una respuesta de error estandarizada
 * @param {string} code - Código de error (ej: 'ERR_100')
 * @param {string} customMessage - Mensaje personalizado (opcional)
 * @param {string} field - Campo específico del error (opcional)
 * @param {any} details - Detalles adicionales (opcional)
 * @returns {Object} Objeto de error estandarizado anidado en {error: {...}}
 */
export const createError = (code, customMessage = null, field = null, details = null) => {
  const message = customMessage || ERROR_CODES[code] || 'Error desconocido';

  const errorObj = {
    code,
    message,
    timestamp: new Date().toISOString()
  };

  if (field) errorObj.field = field;
  if (details) errorObj.details = details;

  // Devolver el error anidado dentro de un objeto "error"
  return { error: errorObj };
};

/**
 * Respuesta de éxito estandarizada
 * @param {any} data - Datos a retornar
 * @param {string} message - Mensaje opcional
 * @returns {Object} Respuesta de éxito
 */
export const createSuccess = (data, message = null) => ({
  success: true,
  data,
  ...(message && { message }),
  timestamp: new Date().toISOString()
});

/**
 * Respuesta de paginación estandarizada
 * @param {Array} data - Array de items
 * @param {number} totalCount - Total de registros
 * @param {number} currentPage - Página actual
 * @param {number} pageSize - Tamaño de página
 * @param {number} totalPages - Total de páginas
 * @returns {Object} Respuesta paginada
 */
