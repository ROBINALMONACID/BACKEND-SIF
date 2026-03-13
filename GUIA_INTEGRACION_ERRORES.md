# 🎯 Guía de Integración Frontend-Backend - Sistema de Errores

## 📊 Flujo Completo de Manejo de Errores

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (PETSHOP 3.0.3.1)                  │
│                                                                     │
│  1. Usuario intenta crear cliente con documento duplicado          │
│     ┌────────────────────────────────────────────┐                 │
│     │ Formulario:                                │                 │
│     │ - Nombre: Juan                             │                 │
│     │ - Apellido: Pérez                          │                 │
│     │ - Documento: 12345678 ← YA EXISTE          │                 │
│     │ - Email: juan@example.com                  │                 │
│     │ - Teléfono: +57 300 1234567                │                 │
│     └────────────────────────────────────────────┘                 │
│                           ↓                                        │
│     POST /api/v1/clientes                                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                 │
│                                                                     │
│  2. Controlador recibe la petición                                  │
│     src/controllers/cliente.controller.js                           │
│                           ↓                                        │
│  3. Validaciones:                                                   │
│     ✅ Campos requeridos → OK                                       │
│     ✅ Formato email → OK                                           │
│     ✅ Formato teléfono → OK                                        │
│     ❌ Documento duplicado → ENCONTRADO                             │
│                           ↓                                        │
│  4. Genera error estandarizado:                                     │
│     createError('ERR_204', null, 'numero_documento', {              │
│       valor_duplicado: '12345678'                                   │
│     })                                                              │
│                           ↓                                        │
│  5. Responde con HTTP 409 Conflict                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPUESTA JSON (409 Conflict)                    │
│                                                                     │
│  {                                                                  │
│    "code": "ERR_204",                                               │
│    "message": "Número de documento ya existe",                      │
│    "field": "numero_documento",                                     │
│    "details": {                                                     │
│      "valor_duplicado": "12345678"                                  │
│    },                                                               │
│    "timestamp": "2025-12-05T15:30:45.123Z"                          │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Recibe respuesta)                 │
│                                                                     │
│  6. Sistema de traducción de errores                                │
│     errorCodes.js:                                                  │
│     - Código: ERR_204                                               │
│     - Mensaje: "Número de documento ya existe"                      │
│     - Campo: numero_documento → "Número de documento"               │
│                           ↓                                        │
│  7. Muestra mensaje al usuario:                                     │
│     ┌────────────────────────────────────────────┐                 │
│     │ ⚠️ Error al crear cliente                  │                 │
│     │                                            │                 │
│     │ Número de documento: Número de documento   │                 │
│     │ ya existe                                  │                 │
│     │                                            │                 │
│     │ Valor duplicado: 12345678                  │                 │
│     │                                            │                 │
│     │ [Cerrar]                                   │                 │
│     └────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Comparación: Antes vs Después

### ❌ ANTES (Sistema Antiguo)

```javascript
// Backend (Antes)
catch (error) {
  res.status(400).json({ error: error.message });
  // Respuesta: { "error": "Duplicate entry '12345678' for key 'numero_documento'" }
}

// Frontend (Antes)
// ❌ Mensaje técnico, no amigable
// ❌ No se identifica el campo específico
// ❌ Usuario confundido
```

**Resultado en pantalla:**
```
Error: Duplicate entry '12345678' for key 'numero_documento'
```
😕 Usuario no entiende el mensaje

---

### ✅ DESPUÉS (Sistema Nuevo)

```javascript
// Backend (Después)
const existeDocumento = await Cliente.findOne({ where: { numero_documento } });
if (existeDocumento) {
  return res.status(409).json(createError('ERR_204', null, 'numero_documento', { 
    valor_duplicado: numero_documento 
  }));
}

// Respuesta:
{
  "code": "ERR_204",
  "message": "Número de documento ya existe",
  "field": "numero_documento",
  "details": { "valor_duplicado": "12345678" },
  "timestamp": "2025-12-05T15:30:45.123Z"
}

// Frontend (Después)
// ✅ Mensaje claro en español
// ✅ Campo específico identificado
// ✅ Detalles adicionales útiles
// ✅ Usuario sabe qué corregir
```

**Resultado en pantalla:**
```
⚠️ Número de documento ya existe

El documento "12345678" ya está registrado en el sistema.
Por favor, verifica el número o contacta al administrador.
```
😊 Usuario entiende perfectamente el problema

---

## 📋 Tabla de Códigos de Error Implementados

### Errores de Duplicados (409 Conflict)
| Código | Mensaje | Campo | Uso |
|--------|---------|-------|-----|
| `ERR_204` | "Número de documento ya existe" | `numero_documento` | Clientes |
| `ERR_211` | "Número de teléfono ya existe" | `numero_telefono` | Clientes |
| `ERR_212` | "Correo electrónico ya existe" | `correo_electronico` | Clientes |
| `ERR_101` | "Correo electrónico ya existe" | `correo_electronico` | Usuarios |
| `ERR_302` | "Código SKU ya existe" | `codigo_sku` | Productos |

### Errores de Validación (400 Bad Request)
| Código | Mensaje | Campo | Uso |
|--------|---------|-------|-----|
| `ERR_201` | "Primer nombre requerido" | `primer_nombre` | Clientes |
| `ERR_202` | "Primer apellido requerido" | `primer_apellido` | Clientes |
| `ERR_206` | "Correo electrónico inválido" | `correo_electronico` | Clientes |
| `ERR_208` | "Número de teléfono inválido" | `numero_telefono` | Clientes |
| `ERR_800` | "Faltan datos obligatorios" | - | General |
| `ERR_801` | "No se proporcionó archivo" | `image` | Upload |
| `ERR_802` | "Formato de imagen inválido" | `image` | Upload |
| `ERR_803` | "Archivo muy grande (máximo 5MB)" | `image` | Upload |
| `ERR_804` | "Tipo de dato incorrecto" | - | General |
| `ERR_805` | "Fecha inválida" | - | General |
| `ERR_806` | "Número inválido" | - | General |

### Errores de Recursos No Encontrados (404 Not Found)
| Código | Mensaje | Uso |
|--------|---------|-----|
| `ERR_200` | "Cliente no encontrado" | Clientes |
| `ERR_300` | "Producto no encontrado" | Productos |
| `ERR_100` | "Usuario no encontrado" | Usuarios |

### Errores de Autenticación (401 Unauthorized)
| Código | Mensaje | Uso |
|--------|---------|-----|
| `ERR_001` | "Credenciales inválidas" | Login |
| `ERR_004` | "Token expirado" | Auth |
| `ERR_005` | "Token inválido" | Auth |

---

## 🎨 Ejemplos Visuales de Mensajes

### Ejemplo 1: Documento Duplicado

**Backend devuelve:**
```json
{
  "code": "ERR_204",
  "message": "Número de documento ya existe",
  "field": "numero_documento",
  "details": { "valor_duplicado": "12345678" },
  "timestamp": "2025-12-05T15:30:45.123Z"
}
```

**Frontend muestra:**
```
┌─────────────────────────────────────────────┐
│  ⚠️  Error en el formulario                 │
│                                             │
│  Campo: Número de documento                 │
│  Error: Número de documento ya existe       │
│                                             │
│  El documento 12345678 ya está registrado.  │
│                                             │
│  [Aceptar]                                  │
└─────────────────────────────────────────────┘
```

---

### Ejemplo 2: Teléfono Duplicado

**Backend devuelve:**
```json
{
  "error": {
    "code": "ERR_211",
    "message": "Número de teléfono ya existe",
    "field": "numero_telefono",
    "details": { "valor_duplicado": "+57 300 1234567" },
    "timestamp": "2025-12-05T15:31:20.456Z"
  }
}
```

**Frontend muestra:**
```
┌─────────────────────────────────────────────┐
│  ⚠️  Error en el formulario                 │
│                                             │
│  Campo: Número de teléfono                  │
│  Error: Número de teléfono ya existe        │
│                                             │
│  El teléfono +57 300 1234567 ya está        │
│  registrado en el sistema.                  │
│                                             │
│  [Aceptar]                                  │
└─────────────────────────────────────────────┘
```

---

### Ejemplo 3: Correo Electrónico Duplicado (ERR_212)

**Backend devuelve:**
```json
{
  "error": {
    "code": "ERR_212",
    "message": "Correo electrónico ya existe",
    "field": "correo_electronico",
    "details": { "valor_duplicado": "juan@example.com" },
    "timestamp": "2025-12-05T15:32:10.789Z"
  }
}
```

**Validación SQL:**
```sql
-- Verificar antes de INSERT
SELECT id_cliente, primer_nombre, primer_apellido 
FROM clientes 
WHERE correo_electronico = :correo_electronico;

-- Si existe → Error ERR_212
```

**Código Backend (CREATE):**
```javascript
// 4. Validar correo duplicado
const existingEmail = await Cliente.findOne({ 
  where: { correo_electronico } 
});

if (existingEmail) {
  return res.status(409).json(createError(
    'ERR_212',
    null,
    'correo_electronico',
    { 
      valor_duplicado: correo_electronico,
      cliente_existente: `${existingEmail.primer_nombre} ${existingEmail.primer_apellido}`
    }
  ));
}
```

**Código Backend (UPDATE):**
```javascript
// 4. Validar correo duplicado (excluyendo el cliente actual)
if (correo_electronico) {
  const existingEmail = await Cliente.findOne({ 
    where: { correo_electronico } 
  });
  
  if (existingEmail && existingEmail.id_cliente != id) {
    return res.status(409).json(createError(
      'ERR_212',
      null,
      'correo_electronico',
      { 
        valor_duplicado: correo_electronico,
        cliente_id: existingEmail.id_cliente
      }
    ));
  }
}
```

**Frontend muestra:**
```
┌─────────────────────────────────────────────┐
│  ⚠️  Error en el formulario                 │
│                                             │
│  Campo: Correo electrónico                  │
│  Error: Correo electrónico ya existe        │
│                                             │
│  El correo juan@example.com ya está         │
│  registrado en el sistema.                  │
│                                             │
│  [Aceptar]                                  │
└─────────────────────────────────────────────┘
```

---

### Ejemplo 3: SKU Duplicado

**Backend devuelve:**
```json
{
  "code": "ERR_302",
  "message": "Código SKU ya existe",
  "field": "codigo_sku",
  "details": { "valor_duplicado": "PROD-001" },
  "timestamp": "2025-12-05T15:32:10.789Z"
}
```

**Frontend muestra:**
```
┌─────────────────────────────────────────────┐
│  ⚠️  Error al crear producto                │
│                                             │
│  Campo: Código SKU                          │
│  Error: Código SKU ya existe                │
│                                             │
│  El código PROD-001 ya está asignado a      │
│  otro producto. Por favor, usa un código    │
│  diferente.                                 │
│                                             │
│  [Aceptar]                                  │
└─────────────────────────────────────────────┘
```

---

### Ejemplo 4: Campo Requerido

**Backend devuelve:**
```json
{
  "code": "ERR_202",
  "message": "Primer apellido requerido",
  "field": "primer_apellido",
  "timestamp": "2025-12-05T15:33:05.123Z"
}
```

**Frontend muestra:**
```
┌─────────────────────────────────────────────┐
│  ⚠️  Campos requeridos faltantes            │
│                                             │
│  Campo: Primer apellido                     │
│  Error: Primer apellido requerido           │
│                                             │
│  Por favor, completa todos los campos       │
│  obligatorios marcados con *.               │
│                                             │
│  [Aceptar]                                  │
└─────────────────────────────────────────────┘
```

---

## 🔧 Implementación en el Backend

### Estructura del Controlador (cliente.controller.js)

```javascript
// 1. Importar helper de errores
import { createError } from '../utils/errorHelper.js';

// 2. Validar datos requeridos
if (!numero_documento) {
  return res.status(400).json(createError('ERR_203', null, 'numero_documento'));
}

// 3. Verificar duplicados
const existeDocumento = await Cliente.findOne({ where: { numero_documento } });
if (existeDocumento) {
  return res.status(409).json(createError('ERR_204', null, 'numero_documento', { 
    valor_duplicado: numero_documento 
  }));
}

// 4. Validar formato
if (!/^\+?[0-9\s-]{7,15}$/.test(numero_telefono)) {
  return res.status(400).json(createError('ERR_208', null, 'numero_telefono'));
}

// 5. Manejar errores de Sequelize
catch (error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path;
    if (field === 'numero_documento') {
      return res.status(409).json(createError('ERR_204', null, 'numero_documento'));
    }
  }
  res.status(500).json(createError('ERR_900', error.message, null, { stack: error.stack }));
}
```

---

## 🎯 Ventajas del Nuevo Sistema

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Mensajes** | Técnicos, en inglés | Claros, en español |
| **Identificación** | No se sabe qué campo falló | Campo específico identificado |
| **Consistencia** | Formatos variables | Formato estandarizado |
| **Debugging** | Difícil identificar origen | Código de error único |
| **UX** | Usuario confundido | Usuario sabe qué hacer |
| **Mantenimiento** | Cambios en múltiples lugares | Cambios centralizados |
| **Logging** | Logs inconsistentes | Logs estructurados |

---

## 📞 Endpoints Actualizados

Todos estos endpoints ahora retornan errores en el formato estandarizado:

### Clientes
- `POST /api/v1/clientes` - Crear cliente
- `PUT /api/v1/clientes/:id` - Actualizar cliente
- `GET /api/v1/clientes/:id` - Obtener cliente

### Productos
- `POST /api/v1/productos` - Crear producto
- `PUT /api/v1/productos/:id` - Actualizar producto
- `GET /api/v1/productos/:id` - Obtener producto
- `DELETE /api/v1/productos/:id` - Eliminar producto

### Usuarios
- `POST /api/v1/users` - Crear usuario
- `PUT /api/v1/users/:id` - Actualizar usuario
- `POST /api/v1/users/with-role` - Crear usuario con rol
- `PUT /api/v1/users/:id/with-role` - Actualizar usuario con rol
- `GET /api/v1/users/:id` - Obtener usuario
- `DELETE /api/v1/users/:id` - Eliminar usuario

---

## ✅ Estado de Implementación

```
✅ Sistema de códigos de error (100+ códigos)
✅ Función createError() mejorada
✅ Validaciones en clientes (duplicados + formato)
✅ Validaciones en productos (duplicados + formato)
✅ Validaciones en usuarios (duplicados + formato)
✅ Middleware global de errores
✅ Handler de rutas 404
✅ Manejo automático de errores de Sequelize
✅ Integración en app.js
✅ Documentación completa
✅ Scripts de prueba
```

---

## 🎉 Resultado Final

El backend ahora está **100% sincronizado** con el frontend, proporcionando:

1. ✅ Mensajes de error claros y en español
2. ✅ Identificación precisa de campos con errores
3. ✅ Códigos de error únicos para cada situación
4. ✅ Información adicional útil para el usuario
5. ✅ Experiencia de usuario mejorada
6. ✅ Debugging más fácil para desarrolladores
7. ✅ Mantenimiento simplificado del código

**¡Sistema de errores estandarizado implementado exitosamente! 🚀**
