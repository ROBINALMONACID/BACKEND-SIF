# GUÍA COMPLETA DEL BACKEND - VetShop API

## Tabla de Contenidos
1. [Introducción a la API](#introducción)
2. [Arquitectura General](#arquitectura)
3. [Flujo de Conexión Frontend-Backend](#flujo-conexión)
4. [Estructura de Carpetas](#estructura)
5. [Configuración Inicial](#configuración)
6. [Base de Datos](#base-de-datos)
7. [Autenticación y Seguridad](#autenticación)
8. [Descripción de Cada Archivo](#archivos)
9. [Flujos de Datos](#flujos-datos)
10. [Manejo de Errores](#errores)

---

## INTRODUCCIÓN

### ¿Qué es una API?
Una API (Interfaz de Programación de Aplicaciones) es un intermediario entre el frontend (lo que ve el usuario) y la base de datos (donde se guardan los datos). El backend es el servidor que ejecuta la API y procesa las solicitudes del frontend.

### Función del Backend en VetShop
El backend de VetShop es una API REST (Representational State Transfer) que:
- **Recibe solicitudes** desde el frontend (cuando el usuario hace clic en botones, llenan formularios, etc.)
- **Procesa los datos** (valida, verifica permisos, busca en la base de datos)
- **Devuelve respuestas** al frontend con los datos solicitados o mensajes de éxito/error

### Ejemplo Simple
Cuando un usuario intenta comprar un producto:
1. El frontend envía una solicitud HTTP: "Crear recibo de caja con producto X"
2. El backend recibe esta solicitud
3. El backend valida que el usuario esté autenticado
4. El backend busca el producto en la base de datos
5. El backend crea el recibo en la base de datos
6. El backend devuelve la respuesta: "Recibo creado exitosamente con ID 123"
7. El frontend recibe la respuesta y actualiza la pantalla

---

## ARQUITECTURA

### Patrón MVC Modificado
El backend usa una arquitectura basada en:
- **Models**: Definen la estructura de datos en la base de datos
- **Controllers**: Contienen la lógica de negocio (qué hacer con los datos)
- **Routers**: Definen las rutas HTTP (URL endpoints)
- **Middleware**: Funciones que se ejecutan antes de llegar al controlador (validaciones, autenticación)
- **Config**: Configuración de conexiones (base de datos, modelos)

### Flujo de una Solicitud
```
Usuario (Frontend)
      ↓
   HTTP Request (GET, POST, PUT, DELETE)
      ↓
   Router (¿A qué ruta va?)
      ↓
   Middleware (¿Es válida la solicitud? ¿Está autenticado?)
      ↓
   Controller (¿Qué lógica aplicar?)
      ↓
   Model (¿Buscar/guardar en base de datos?)
      ↓
   Database (MySQL)
      ↓
   Controller (¿Procesar resultado?)
      ↓
   HTTP Response (Respuesta al frontend)
      ↓
Usuario (Frontend actualiza pantalla)
```

---

## FLUJO DE CONEXIÓN FRONTEND-BACKEND

### Protocolo HTTP
El frontend y backend se comunican usando HTTP (Hypersuper Text Transfer Protocol). Las solicitudes usan métodos estándar:
- **GET**: Obtener datos (no modifica nada)
- **POST**: Crear nuevos datos
- **PUT**: Actualizar datos existentes
- **DELETE**: Eliminar datos

### URLs Base
Todas las solicitudes van a: `http://localhost:3001/api/v1/`

Ejemplos:
- `http://localhost:3001/api/v1/auth/login` - Login de usuario
- `http://localhost:3001/api/v1/usuarios/123` - Obtener usuario con ID 123
- `http://localhost:3001/api/v1/recibo-caja` - Crear recibo

### ¿Dónde está el Frontend?
El frontend (React/JavaScript) se ejecuta en:
- **Desarrollo**: `http://localhost:3000` (puerto diferente al backend)
- **Producción**: En un servidor web (Nginx, Apache, etc)

El problema: El navegador tiene una política de seguridad llamada **Same-Origin Policy** que impide que un sitio en `localhost:3000` haga solicitudes a `localhost:3001`. Esto es para protegerte de sitios maliciosos.

**La solución: CORS**

### ¿Qué es CORS? (Explicación Detallada)

CORS son las siglas de **Cross-Origin Resource Sharing** (Compartir Recursos entre Orígenes). Es un mecanismo de seguridad que implementan los navegadores web modernos para protegerte de ataques.

#### El Problema Original (Same-Origin Policy)

Los navegadores web tienen una regla de seguridad muy importante llamada **Same-Origin Policy** (Política de Mismo Origen). Esta regla dice:

**"Un página web en un dominio solo puede hacer solicitudes a servidores del MISMO dominio"**

Ejemplos:
- Si accedes a `http://localhost:3000`, solo puede hablar con `http://localhost:3000`
- Si accedes a `https://mitienda.com`, solo puede hablar con `https://mitienda.com`
- NO puede hablar con `http://localhost:3001` (diferente puerto = diferente origen)
- NO puede hablar con `https://otratienda.com` (diferente dominio)

**¿Por qué existe esta regla?**

Imagina este ataque:
1. Visitas un sitio malicioso: `http://sitio-malicioso.com`
2. El sitio tiene JavaScript que intenta:
   - Hacer solicitud a tu banco: `http://tubank.com/api/transferir-dinero`
   - Enviar: `{ "dinero": 10000, "cuenta": "atacante" }`
3. Si no existiera Same-Origin Policy, tu navegador enviaría la solicitud
4. Si tú estás logged in en el banco, el servidor confiaría en la solicitud
5. ¡Te robarían dinero!

**La regla previene esto:** El navegador rechaza solicitudes a dominios diferentes.

#### Cómo Funciona CORS

CORS es la solución a este dilema: Necesitas que frontend (localhost:3000) y backend (localhost:3001) hablen, pero la Same-Origin Policy lo impide.

**CORS permite al backend dar permiso explícito** al frontend para hacer solicitudes.

Flujo:
1. Frontend quiere hacer una solicitud a backend en otro dominio
2. Navegador intercepta la solicitud (CORS)
3. Navegador envía solicitud OPTIONS (preflight) al backend preguntando:
   - "¿Puedo hacer una solicitud POST desde http://localhost:3000?"
4. Backend responde con headers CORS:
   - "Sí, puedes hacer solicitudes desde http://localhost:3000"
   - "Puedes usar métodos: GET, POST, PUT, DELETE"
   - "Puedes enviar headers: Content-Type, Authorization"
5. Si backend permite, navegador envía la solicitud real
6. Si backend no permite, navegador rechaza la solicitud (error CORS)

#### Orígenes (Origins)

Un "origen" en CORS se define por:
- **Protocolo**: http:// o https://
- **Dominio**: localhost, mitienda.com, etc
- **Puerto**: 3000, 3001, 80, 443, etc

Ejemplos de DIFERENTES orígenes:
- `http://localhost:3000` ≠ `http://localhost:3001` (diferentes puertos)
- `http://localhost:3000` ≠ `https://localhost:3000` (diferentes protocolos)
- `http://mitienda.com` ≠ `http://mitienda.com:8000` (diferentes puertos)

Ejemplos del MISMO origen:
- `http://localhost:3000/pagina1` ≈ `http://localhost:3000/pagina2` (mismo dominio y puerto)
- `https://mitienda.com/api/usuarios` ≈ `https://mitienda.com/api/productos` (mismo dominio)

#### Headers CORS

El backend y frontend comunican mediante headers especiales de CORS:

**Headers que el backend RECIBE (en preflight):**
- `Origin: http://localhost:3000` - Quién está haciendo la solicitud
- `Access-Control-Request-Method: POST` - Qué método HTTP quiere usar

**Headers que el backend RESPONDE:**
- `Access-Control-Allow-Origin: http://localhost:3000` - Quién puede acceder (específico)
- `Access-Control-Allow-Origin: *` - Quién puede acceder (cualquiera, menos seguro)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE` - Qué métodos se permiten
- `Access-Control-Allow-Headers: Content-Type, Authorization` - Qué headers se permiten
- `Access-Control-Allow-Credentials: true` - Si se permiten cookies/credenciales
- `Access-Control-Max-Age: 86400` - Cuánto tiempo cachear estas respuestas (en segundos)

#### Tipos de Solicitudes CORS

**Solicitudes Simples (No requieren preflight):**
- GET, POST, HEAD
- Solo headers básicos: Accept, Content-Language, Content-Type
- El navegador envía la solicitud directo

**Solicitudes Complejas (Requieren preflight):**
- PUT, DELETE, PATCH
- Headers personalizados: Authorization, X-Custom-Header
- Content-Type: application/json
- El navegador PRIMERO envía OPTIONS, luego la solicitud real

En VetShop:
- POST /recibo-caja con Authorization header = requiere preflight
- GET /productos sin headers especiales = solicitud simple

#### Configuración de CORS en Express

**Sin CORS (lo que está comentado en VetShop):**
```
Frontend (localhost:3000) intenta hacer solicitud
Navegador ve que es diferente origen
Navegador rechaza: "Cross-Origin Request Blocked"
Frontend nunca recibe respuesta (error de red)
```

**Con CORS (lo que está en VetShop - app.js):**
```
app.use(cors()) → Permite solicitudes desde cualquier origen
o
app.use(cors({ origin: 'http://localhost:3000' })) → Solo permite desde ese origen
```

#### Errores CORS Comunes

**Error 1: "No 'Access-Control-Allow-Origin' header"**
- Significa: Backend no tiene CORS habilitado
- Solución: Agregar `app.use(cors())` en app.js

**Error 2: "Method not allowed by CORS policy"**
- Significa: Frontend intenta usar un método que backend no permite
- Ejemplo: Quiere hacer DELETE pero backend solo permite GET
- Solución: Agregar método a `Access-Control-Allow-Methods`

**Error 3: "Header not allowed by CORS policy"**
- Significa: Frontend envía un header que backend no permite
- Ejemplo: Quiere enviar `Authorization: Bearer TOKEN` pero no está permitido
- Solución: Agregar header a `Access-Control-Allow-Headers`

**Error 4: Solicitud sale pero no se ve respuesta**
- Significa: CORS preflight pasó, pero la solicitud real falló
- Solución: No es error de CORS, es error de la solicitud real (revisar backend)

#### Por Qué VetShop Necesita CORS

En desarrollo:
- Frontend corre en `http://localhost:3000`
- Backend corre en `http://localhost:3001`
- Son DIFERENTES orígenes por el puerto
- Sin CORS, frontend no puede hablar con backend

En producción:
- Frontend y backend podrían estar en servidores distintos
- CORS sigue siendo necesario
- Deberías configurar un origen específico: `cors({ origin: 'https://tudominio.com' })`

### Cómo se Configura CORS en VetShop
En el archivo `app.js`, se configura CORS de la siguiente manera:

El backend importa el middleware CORS y lo aplica ANTES de cualquier otra ruta:
- `app.use(cors())` - Esto permite solicitudes desde CUALQUIER origen (desarrollo)
- En producción, deberías especificar: `cors({ origin: 'https://mitienda.com' })`

### Flujo de una Solicitud con CORS

**1. Frontend envía solicitud:**
```
El usuario hace clic en "Comprar"
Frontend ejecuta: fetch('http://localhost:3001/api/v1/recibo-caja', {...})
El navegador PRIMERO envía una solicitud OPTIONS (preflight) preguntando:
  "¿Puedo hacer una solicitud POST desde http://localhost:3000?"
```
**2. Backend responde al preflight:**
```
El middleware CORS en backend responde:
  "Sí, puedes hacer solicitudes desde cualquier origen (localhost:3000, etc)"
  Headers enviados:
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  - Access-Control-Allow-Headers: Content-Type, Authorization
```

**3. Frontend envía la solicitud real:**
```
Después de recibir permiso, el navegador envía la solicitud real
con los datos que necesita (email, contraseña, producto, etc)
```

**4. Backend procesa y responde:**
```
El backend procesa la solicitud normalmente
Devuelve la respuesta con los headers CORS
El navegador permite que el JavaScript del frontend lea la respuesta
```

### Headers Importantes
El frontend siempre envía headers (información adicional):
- `Content-Type: application/json` - Los datos van en formato JSON
- `Authorization: Bearer TOKEN` - Token de autenticación para proteger rutas

**El backend responde con headers CORS:**
- `Access-Control-Allow-Origin: http://localhost:3000` - Quién puede acceder
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE` - Qué métodos HTTP
- `Access-Control-Allow-Headers: Content-Type, Authorization` - Qué headers se permiten
- `Access-Control-Allow-Credentials: true` - Si se permiten cookies

### Formato de Respuestas
El backend siempre responde en formato JSON:
- **Respuesta exitosa** (HTTP 201/200):
  ```
  {
    "success": true,
    "token": "eyJhbGc...",
    "user": {
      "id": "123",
      "email": "usuario@test.com",
      "roles": ["Administrador"]
    }
  }
  ```

- **Respuesta con error** (HTTP 400/500):
  ```
  {
    "error": {
      "code": "ERR_100",
      "message": "Usuario no encontrado",
      "field": {...}
    }
  }
  ```

---

## ESTRUCTURA DE CARPETAS

```
node taller/
├── src/                          # Código fuente principal
│   ├── index.js                  # Punto de entrada de la aplicación
│   ├── app/
│   │   └── app.js               # Configuración de Express y rutas
│   ├── config/
│   │   ├── connect.db.js        # Conexión a MySQL
│   │   └── models.app.js        # Definición de asociaciones
│   ├── controllers/              # Lógica de negocio
│   │   ├── auth.controller.js
│   │   ├── usuario.controller.js
│   │   ├── cliente.controller.js
│   │   ├── producto.controller.js
│   │   ├── categoria.controller.js
│   │   ├── reciboCaja.controller.js
│   │   └── cierreCaja.controller.js
│   ├── models/                   # Estructura de datos
│   │   ├── usuario.model.js
│   │   ├── cliente.model.js
│   │   ├── producto.model.js
│   │   ├── categoria.model.js
│   │   ├── rol.model.js
│   │   ├── reciboCaja.model.js
│   │   ├── productoRecibo.model.js
│   │   ├── cierreCaja.model.js
│   │   └── ... (otros modelos)
│   ├── routers/                  # Definición de rutas
│   │   ├── auth.router.js
│   │   ├── user.router.js
│   │   ├── cliente.router.js
│   │   ├── producto.router.js
│   │   ├── categoria.router.js
│   │   ├── reciboCaja.router.js
│   │   └── cierreCaja.router.js
│   ├── middleware/               # Validaciones previas
│   │   ├── auth.middleware.js   # Verificar JWT
│   │   ├── errorHandler.middleware.js
│   │   └── upload.middleware.js
│   ├── utils/
│   │   └── errorHelper.js       # Códigos de error estandarizados
│   └── uploads/                 # Imágenes subidas por usuarios
├── mysql_schema.sql             # Estructura de la base de datos
├── package.json                 # Dependencias del proyecto
└── .env                         # Variables de entorno (contraseñas, URLs)
```

---

## CONFIGURACIÓN INICIAL

### ¿Qué es Node.js y Express?
- **Node.js**: Es un entorno que permite ejecutar JavaScript en el servidor (no en el navegador)
- **Express**: Es un framework que simplifica la creación de APIs en Node.js

### Punto de Entrada (index.js)
Cuando ejecutas `npm start`, Node.js busca el archivo `src/index.js` que:
1. Importa la aplicación Express desde `app/app.js`
2. Carga variables de entorno desde `.env` (contraseñas, puerto, URLs)
3. Inicializa los modelos de Sequelize con `modelsApp(false)`
4. Inserta datos iniciales (categorías y productos) si es la primera vez
5. Inicia el servidor escuchando en el puerto 3001

### Variables de Entorno (.env)
El archivo `.env` contiene configuraciones sensibles que NO deben estar en GitHub:
- `DB_HOST`: Dirección del servidor MySQL
- `DB_USER`: Usuario de MySQL
- `DB_PASSWORD`: Contraseña de MySQL
- `DB_NAME`: Nombre de la base de datos
- `JWT_SECRET`: Clave secreta para generar tokens de autenticación
- `PORT`: Puerto del servidor (default 3001)

---

## BASE DE DATOS

### ¿Qué es MySQL y Sequelize?
- **MySQL**: Base de datos relacional que almacena todos los datos
- **Sequelize**: ORM (Object-Relational Mapping) que permite interactuar con MySQL usando JavaScript en lugar de SQL

### Tablas Principales

#### 1. **usuarios**
Almacena información de los empleados/administradores del sistema.
- `id_usuario`: Identificador único (string)
- `correo_electronico`: Email para login
- `contraseña`: Hash bcrypt de la contraseña (nunca se guarda en texto plano)
- `activado`: Si la cuenta está activa
- `idioma`: Idioma preferido (es/en)
- `url_imagen`: Foto de perfil

#### 2. **roles**
Define los permisos disponibles en el sistema (Administrador, Vendedor, etc).
- `id_rol`: Identificador único
- `nombre_rol`: Nombre del rol
- `descripcion`: Para qué sirve este rol

#### 3. **usuario_rol**
Tabla de unión que relaciona usuarios con múltiples roles (un usuario puede ser Admin y Vendedor).

#### 4. **clientes**
Información de los clientes que compran en la tienda.
- `id_cliente`: Identificador único
- `nombre_cliente`: Nombre del cliente
- `apellido_cliente`: Apellido
- `numero_documento`: Número de identificación
- `correo_cliente`: Email del cliente
- `numero_telefonico`: Teléfono
- `direccion`: Domicilio
- `id_tipo_documento`: Referencia al tipo de documento (CC, TI, etc)
- `id_usuario`: Usuario que registró al cliente

#### 5. **categorias**
Categorías de productos (Alimentos, Accesorios, etc).
- `id_categoria`: Identificador único
- `nombre_categoria`: Nombre
- `estado`: activo/inactivo

#### 6. **productos**
Inventario de productos disponibles.
- `id_producto`: Identificador único
- `codigo_sku`: Código único del producto
- `nombre_producto`: Nombre
- `stock`: Cantidad disponible
- `precio_unitario`: Precio en COP
- `presentacion_producto`: Tamaño/presentación
- `estado`: activo/inactivo
- `id_categoria`: Referencia a la categoría

#### 7. **recibo_caja**
Cada venta realizada genera un recibo de caja.
- `id_recibo_caja`: Identificador único
- `id_cliente`: Cliente que compró
- `total`: Monto total de la venta
- `tipo_pago`: efectivo, tarjeta_credito, tarjeta_debito
- `fecha_recibo_caja`: Cuándo se realizó la venta
- Relación 1:N con productos_recibo

#### 8. **productos_recibo**
Detalle de cada producto vendido en un recibo.
- `id_producto_recibo`: Identificador único
- `id_recibo_caja`: Referencia al recibo
- `id_producto`: Referencia al producto
- `cantidad`: Cuántas unidades se vendieron
- `precio_venta`: Precio unitario en ese momento

#### 9. **cierres_caja**
Consolidación diaria/semanal/mensual de todas las ventas.
- `id_cierre_caja`: Identificador único
- `tipo_periodo`: diario, semanal, quincenal, mensual, anual
- `fecha_inicio`: Cuándo comienza el período
- `fecha_fin`: Cuándo termina el período
- `total_ventas`: Suma de todas las ventas
- `cantidad_recibos`: Cuántos recibos se hicieron
- `id_usuario`: Usuario que hizo el cierre

### Relaciones Entre Tablas
Las tablas se relacionan mediante "foreign keys" (claves foráneas):
- `usuarios` ← (1:N) → `usuario_rol` → (N:1) → `roles`
- `usuarios` → (1:N) → `cliente`
- `clientes` ← (1:N) → `recibo_caja`
- `productos` ← (1:N) → `productos_recibo` → (N:1) → `recibo_caja`
- `usuarios` ← (1:N) → `cierres_caja`

Esto significa:
- Un usuario puede tener múltiples roles
- Un usuario puede tener múltiples clientes registrados
- Un cliente puede hacer múltiples compras
- Una compra (recibo) contiene múltiples productos
- Un cierre de caja resume múltiples recibos

---

## AUTENTICACIÓN Y SEGURIDAD

### ¿Por qué JWT?
JWT (JSON Web Token) es un método seguro para autenticar solicitudes:
1. Usuario hace login con email y contraseña
2. Backend verifica que sean correctos (contraseña encriptada)
3. Backend genera un token JWT que es una clave única
4. Frontend guarda este token en localStorage
5. En cada solicitud posterior, frontend envía el token
6. Backend verifica que el token sea válido antes de procesar

### Flujo de Login
1. **Frontend** envía POST a `/api/v1/auth/login` con email y contraseña
2. **Backend** (auth.controller.js):
   - Busca el usuario por email
   - Verifica que la contraseña sea correcta (usando bcrypt)
   - Genera un JWT con los datos del usuario
   - Retorna token + datos del usuario
3. **Frontend** guarda el token y puede hacer solicitudes autenticadas

### Middleware de Autenticación
En cada ruta protegida (como crear recibo), el middleware `auth.middleware.js`:
1. Obtiene el token del header `Authorization: Bearer TOKEN`
2. Verifica que el token sea válido
3. Extrae los datos del usuario desde el token
4. Si es válido, permite que continúe
5. Si no es válido, rechaza la solicitud (HTTP 401)

### Encriptación de Contraseñas
Las contraseñas NUNCA se guardan en texto plano. Se usan dos métodos:
- **bcrypt**: Encripta la contraseña al crear o cambiar
- **Comparación**: Al login, bcrypt compara la contraseña ingresada con la encriptada guardada

---

## DESCRIPCIÓN DETALLADA DE CADA ARCHIVO

### CONFIGURACIÓN (src/config/)

#### **connect.db.js**
Este archivo establece la conexión entre Node.js y MySQL.
- Importa Sequelize (el intermediario que entiende ambos lenguajes)
- Lee variables de entorno (.env) para obtener credenciales
- Intenta conectarse al servidor MySQL
- Si la conexión es exitosa, el backend puede usar la base de datos
- Si falla, el backend no inicia (error crítico)

#### **models.app.js**
Este archivo define cómo se relacionan las tablas entre sí.
- Importa todos los modelos (usuario, producto, cliente, etc)
- Define relaciones 1:1 (un usuario tiene un cliente)
- Define relaciones 1:N (un cliente tiene muchas compras)
- Define relaciones N:N (un usuario puede tener múltiples roles)
- Se ejecuta cuando el backend inicia para que Sequelize entienda las relaciones

### MODELOS (src/models/)

Los archivos modelo definen la estructura de datos de cada tabla.

#### **usuario.model.js**
Define la tabla `usuarios`:
- Qué campos tiene (id, email, contraseña, etc)
- Qué tipo de datos son (string, date, boolean, etc)
- Validaciones (email único, contraseña mínimo 6 caracteres, etc)
- Métodos especiales (crear usuario con contraseña encriptada, etc)

#### **cliente.model.js**
Define la tabla `clientes`:
- Información del cliente
- Tipo de documento
- Validaciones de email y teléfono únicos
- Relación con usuario (quién registró al cliente)

#### **producto.model.js**
Define la tabla `productos`:
- Campos del inventario (nombre, precio, stock, etc)
- SKU único para cada producto
- Categoría a la que pertenece
- Estados (activo/inactivo)

#### **categoria.model.js**
Define las categorías de productos

#### **rol.model.js**
Define los roles disponibles (permisos del sistema)

#### **usuario_rol.model.js**
Tabla de unión entre usuarios y roles (un usuario puede tener múltiples roles)

#### **reciboCaja.model.js**
Define cada venta realizada:
- Total de la venta
- Tipo de pago
- Cliente que compró
- Relación con productos vendidos

#### **productoRecibo.model.js**
Define los detalles de cada producto en una venta:
- Cuántas unidades se vendieron
- A qué precio se vendieron
- Referencia al producto original

#### **cierreCaja.model.js**
Define los cierres consolidados:
- Período (diario, semanal, etc)
- Total de ventas en ese período
- Cantidad de recibos

#### **tipoDocumento.model.js**
Define tipos de documento (CC, TI, pasaporte, etc)

### CONTROLADORES (src/controllers/)

Los controladores contienen toda la lógica de negocio (lo que hace la aplicación).

#### **auth.controller.js**
Maneja todo relacionado con autenticación:
- **Login**: Verifica email/contraseña y genera JWT
- **Register**: Crea un nuevo usuario (solo administrador puede hacer esto)
- **Me**: Retorna los datos del usuario actualmente autenticado
La lógica es:
1. Recibir datos del frontend
2. Validar que sean correctos
3. Interactuar con la base de datos
4. Retornar respuesta (éxito o error)

#### **user.controller.js**
Gestión de usuarios:
- **Create**: Crear nuevo usuario
- **GetAll**: Listar todos los usuarios con paginación
- **GetById**: Obtener datos de un usuario específico
- **Update**: Actualizar nombre, idioma, foto, etc
- **UpdateRole**: Asignar o cambiar roles del usuario
- **Delete**: Eliminar usuario
Cada método recibe datos del router, los valida, busca en base de datos y retorna respuesta.

#### **cliente.controller.js**
Gestión de clientes:
- **Create**: Registrar nuevo cliente
- **GetAll**: Listar clientes con filtros (por nombre, documento, etc)
- **GetById**: Obtener datos de un cliente
- **Update**: Actualizar información del cliente
- **Delete**: Eliminar cliente
La lógica es similar a usuarios pero orientada a clientes.

#### **categoria.controller.js**
Gestión de categorías:
- **Create**: Crear categoría
- **GetAll**: Listar todas las categorías
- **GetById**: Obtener una categoría
- **Update**: Modificar categoría
- **Delete**: Eliminar categoría
- **GetProducts**: Obtener todos los productos de una categoría

#### **producto.controller.js**
Gestión del inventario:
- **Create**: Agregar nuevo producto al catálogo
- **GetAll**: Listar productos con paginación y filtros (por categoría, nombre, etc)
- **GetById**: Ver detalles de un producto
- **Update**: Actualizar precio, stock, nombre, etc
- **Delete**: Sacar un producto del catálogo
Validaciones especiales:
- El SKU debe ser único
- El stock no puede ser negativo
- El precio debe ser positivo

#### **reciboCaja.controller.js**
Gestión de ventas (recibos):
- **Create**: Registrar una venta (seleccionar cliente, productos, cantidad, tipo de pago)
  - Valida que exista stock
  - Actualiza el stock de los productos
  - Crea el registro de venta
  - Crea los detalles de cada producto vendido
- **GetAll**: Listar todas las ventas con filtros (por cliente, fecha, etc)
- **GetById**: Ver detalles de una venta específica
- **Update**: Modificar una venta (precio final, etc)
- **Delete**: Anular una venta (retorna el stock)

#### **cierreCaja.controller.js**
Consolidación de ventas:
- **Create**: Generar un cierre para un período específico
  - Calcula el total de todas las ventas en ese período
  - Cuenta cuántos recibos hay
  - Detalla desglose por tipo de pago
  - Genera resumen para reportes
- **GetAll**: Ver todos los cierres realizados
- **GetById**: Ver detalles completos de un cierre
- **Update**: Agregar observaciones o notas al cierre
- **Delete**: Solo admin puede eliminar cierres recientes

#### **health.controller.js**
Monitoreo del servidor:
- Verifica que el backend esté funcionando
- Verifica que la base de datos esté conectada
- Retorna estado general del sistema
Se usa para que el frontend verifique que el servidor está activo.

#### **upload.controller.js**
Gestión de archivos:
- Recibe imágenes del frontend
- Las guarda en la carpeta `/uploads`
- Retorna la URL para que se muestre en el frontend

### ROUTERS (src/routers/)

Los routers definen las URLs (endpoints) y qué controlador responde.

#### **auth.router.js**
Define las rutas:
- `POST /auth/login` → auth.controller.login
- `POST /auth/register` → auth.controller.register
- `GET /auth/me` → auth.controller.me (requiere autenticación)

#### **user.router.js**
Define las rutas de usuarios:
- `GET /usuarios` → user.controller.getAll (requiere autenticación)
- `GET /usuarios/:id` → user.controller.getById
- `POST /usuarios` → user.controller.create (solo admin)
- `PUT /usuarios/:id` → user.controller.update
- `PUT /usuarios/:id/role` → user.controller.updateRole (solo admin)
- `DELETE /usuarios/:id` → user.controller.delete (solo admin)

#### **cliente.router.js**
Define las rutas de clientes:
- `GET /clientes` → cliente.controller.getAll
- `GET /clientes/:id` → cliente.controller.getById
- `POST /clientes` → cliente.controller.create
- `PUT /clientes/:id` → cliente.controller.update
- `DELETE /clientes/:id` → cliente.controller.delete

#### **producto.router.js**
Define las rutas de productos:
- `GET /productos` → producto.controller.getAll
- `GET /productos/:id` → producto.controller.getById
- `POST /productos` → producto.controller.create (solo admin)
- `PUT /productos/:id` → producto.controller.update
- `DELETE /productos/:id` → producto.controller.delete (solo admin)

#### **categoria.router.js**
Define las rutas de categorías:
- `GET /categorias` → categoria.controller.getAll
- `GET /categorias/:id` → categoria.controller.getById
- `POST /categorias` → categoria.controller.create (solo admin)
- `PUT /categorias/:id` → categoria.controller.update
- `DELETE /categorias/:id` → categoria.controller.delete

#### **reciboCaja.router.js**
Define las rutas de ventas:
- `GET /recibo-caja` → reciboCaja.controller.getAll
- `GET /recibo-caja/:id` → reciboCaja.controller.getById
- `POST /recibo-caja` → reciboCaja.controller.create (requiere autenticación)
- `PUT /recibo-caja/:id` → reciboCaja.controller.update
- `DELETE /recibo-caja/:id` → reciboCaja.controller.delete

#### **cierreCaja.router.js**
Define las rutas de cierres:
- `GET /cierre-caja` → cierreCaja.controller.getAll
- `GET /cierre-caja/:id` → cierreCaja.controller.getById
- `POST /cierre-caja` → cierreCaja.controller.create
- `PUT /cierre-caja/:id` → cierreCaja.controller.update
- `DELETE /cierre-caja/:id` → cierreCaja.controller.delete

#### **health.router.js**
Define las rutas de monitoreo:
- `GET /health` → health.controller.status

#### **upload.router.js**
Define las rutas de carga de archivos:
- `POST /upload` → upload.controller.uploadFile

### MIDDLEWARES (src/middleware/)

Los middlewares son funciones que se ejecutan ANTES de llegar al controlador.

#### **auth.middleware.js**
Verifica autenticación en rutas protegidas:
1. Extrae el token del header Authorization
2. Verifica que el token sea válido (no expirado, no falsificado)
3. Extrae los datos del usuario desde el token
4. Los guarda en la solicitud para que el controlador los use
5. Si no hay token o es inválido, rechaza la solicitud

Ejemplo de uso:
- Cuando haces POST /recibo-caja, el middleware verifica que tengas un token válido
- Si lo tienes, continúa al controlador
- Si no lo tienes, retorna HTTP 401 (no autorizado)

#### **errorHandler.middleware.js**
Captura y formatea errores:
- Si algo falla en un controlador, este middleware lo atrapa
- Lo convierte a un formato JSON consistente
- Retorna un código HTTP apropiado
- Evita que el servidor se caiga por errores no controlados

#### **upload.middleware.js**
Valida archivos antes de subirlos:
- Verifica que el archivo no sea demasiado grande
- Verifica que sea una imagen
- Crea la carpeta /uploads si no existe
- Permite procesar la carga de archivos

### UTILITIES (src/utils/)

#### **errorHelper.js**
Define todos los códigos de error del sistema:
- Cada error tiene un código único (ERR_001, ERR_100, etc)
- Agrupa errores por categoría (autenticación, usuarios, productos, etc)
- Proporciona mensajes claros al frontend
- Facilita depuración y mantenimiento

Ejemplo:
- ERR_001: "Credenciales inválidas" (login incorrecto)
- ERR_100: "Usuario no encontrado"
- ERR_300: "Producto no encontrado"
- ERR_400: "Categoría no encontrada"

### APP (src/app/app.js)

Configuración de Express (el servidor HTTP):
Este archivo es el corazón del backend. Aquí se configura cómo el servidor se comunica con el frontend.

**Configuración de Middlewares Globales:**

1. **Morgan Middleware**
   - Registra cada solicitud HTTP que recibe
   - Útil para depuración: ves qué solicitudes llegan, cuándo, y si fueron exitosas
   - Formato: `GET /api/v1/usuarios 200 45ms`

2. **CORS Middleware (Crucial para Frontend)**
   - Permite que el frontend en `localhost:3000` haga solicitudes a `localhost:3001`
   - Sin CORS, el navegador bloquearía todas las solicitudes por Same-Origin Policy
   - Configuración: `app.use(cors())` permite cualquier origen
   - En producción deberías especificar dominios permitidos

3. **JSON Parser**
   - Interpreta el body de las solicitudes como JSON
   - Cuando el frontend envía `{ email: "user@test.com", password: "123456" }`, este middleware lo convierte en un objeto JavaScript

**Configuración de Rutas:**

- **Routers importados:**
  - userRoutes: Gestión de usuarios
  - categoriaRoutes: Gestión de categorías
  - clienteRoutes: Gestión de clientes
  - productoRoutes: Gestión de productos
  - reciboCajaRoutes: Gestión de ventas
  - cierreCajaRoutes: Consolidados de ventas
  - authRoutes: Autenticación (login/register)
  - healthRoutes: Monitoreo del servidor
  - uploadRoutes: Carga de archivos

- **Mapeo de rutas:** Cada router se registra con `app.use('/api/v1', routeName)`
  - Esto significa que todas las rutas comienzan con `/api/v1`

**Configuración de Archivos Estáticos:**

- `app.use('/uploads', express.static(...))` sirve las imágenes subidas
- El frontend puede acceder a imágenes con: `http://localhost:3001/uploads/nombre.jpg`

**Manejo de Errores Global:**

- Después de todas las rutas, se registra:
  1. `notFoundHandler`: Maneja rutas que no existen (404)
  2. `errorHandler`: Atrapa cualquier error no manejado en los controladores

---

## CÓMO EL FRONTEND SE CONECTA CON EL BACKEND

### Arquitectura de Comunicación

```
Frontend (React en localhost:3000)
         ↓
Axios/Fetch Library
         ↓
HTTP Request con CORS headers
         ↓
Morgan Middleware (registra solicitud)
         ↓
CORS Middleware (verifica que origen sea permitido)
         ↓
Router (determina qué controlador)
         ↓
Auth Middleware (verifica JWT si aplica)
         ↓
Controller (lógica de negocio)
         ↓
Model (busca/guarda en BD)
         ↓
Database (MySQL)
         ↓
Controller procesa resultado
         ↓
HTTP Response con datos JSON
         ↓
Frontend recibe datos y actualiza pantalla
```

### Ejemplo Práctico: Frontend Login

**1. Usuario escribe email y contraseña en formulario**

**2. Frontend hace solicitud:**
```
URL: http://localhost:3001/api/v1/auth/login
Método: POST
Headers:
  - Content-Type: application/json
  - Origin: http://localhost:3000

Body:
{
  "email": "usuario@test.com",
  "password": "123456"
}
```

**3. Backend procesa:**
- Morgan registra: `POST /api/v1/auth/login 200 45ms`
- CORS middleware verifica origen
- Router redirige a authController.login()
- Controller valida credenciales en BD
- Genera JWT token
- Retorna datos del usuario + token

**4. Frontend recibe respuesta:**
```
HTTP 200 - OK
Headers CORS:
  - Access-Control-Allow-Origin: http://localhost:3000
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE

Body:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "usuario@test.com",
    "roles": ["Administrador"]
  }
}
```

**5. Frontend guarda token:**
- Almacena en localStorage: `localStorage.setItem('token', token)`
- Ahora puede hacer solicitudes autenticadas

### Ejemplo Práctico: Frontend Crear Recibo

**1. Empleado selecciona cliente y productos**

**2. Frontend hace solicitud:**
```
URL: http://localhost:3001/api/v1/recibo-caja
Método: POST
Headers:
  - Content-Type: application/json
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (token guardado)
  - Origin: http://localhost:3000

Body:
{
  "id_cliente": 5,
  "tipo_pago": "efectivo",
  "productos": [
    {"id_producto": 2, "cantidad": 3},
    {"id_producto": 7, "cantidad": 1}
  ]
}
```

**3. Backend procesa:**
- Morgan registra solicitud
- CORS middleware verifica origen
- Router redirige a reciboCajaController.create()
- Auth middleware verifica token (extrae usuario del token)
- Controller valida datos
- Controller crea recibo en BD
- Controller actualiza stock de productos
- Retorna recibo creado

**4. Frontend recibe respuesta:**
```
HTTP 201 - CREATED

Body:
{
  "success": true,
  "id_recibo_caja": 42,
  "total": 150000,
  "tipo_pago": "efectivo",
  "cliente": {"id": 5, "nombre": "Juan"}
}
```

**5. Frontend actualiza UI:**
- Muestra mensaje "Venta registrada"
- Recarga lista de recibos
- Actualiza inventario

### Flujo de Tokens en Cada Solicitud

**Primera solicitud (Login):**
- Frontend: No tiene token
- Backend: Genera token
- Frontend: Guarda token en localStorage

**Solicitudes posteriores (Protegidas):**
- Frontend: Incluye token en header Authorization
- Backend: Middleware valida token
- Si token es válido: Continúa
- Si token es inválido/expirado: Retorna HTTP 401
- Frontend: Si recibe 401, elimina token y redirige a login

### Diferencia Entre CORS y Autenticación

**CORS:**
- Permite que navegador envíe solicitud desde diferente dominio
- Sin CORS: Browser bloquea la solicitud antes de llegar al servidor
- Es una protección del navegador

**Autenticación (JWT):**
- Verifica que el usuario sea quién dice ser
- Sin autenticación: Server aceptaría solicitudes de cualquiera
- Es una protección del servidor

**Juntos:**
- CORS permite que el navegador envíe la solicitud
- JWT verifica que el usuario esté autorizado
- Ambos son necesarios para seguridad

---

## FLUJOS DE DATOS COMPLETOS

### Flujo de Login

**Frontend envía:**
```
POST /api/v1/auth/login
Body: { email: "usuario@test.com", password: "123456" }
```

**Backend procesa:**
1. `auth.router.js`: Recibe la solicitud y llama al controlador
2. `auth.controller.js`: 
   - Valida que email y password estén presentes
   - Busca el usuario en base de datos por email
   - Compara la contraseña con la guardada (usando bcrypt)
   - Si coincide, obtiene los roles del usuario
   - Genera un JWT con los datos del usuario
3. `usuario.model.js` y `usuario_rol.model.js`: Buscan los datos en base de datos

**Backend retorna:**
```
HTTP 200 - OK
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "usuario@test.com",
    "roles": ["Administrador"]
  }
}
```

**Frontend recibe:**
1. Guarda el token en localStorage
2. Usa el token en todas las solicitudes futuras en el header Authorization
3. Redirige al dashboard

---

### Flujo de Crear Recibo de Caja (Venta)

**Frontend envía:**
```
POST /api/v1/recibo-caja
Header: Authorization: Bearer TOKEN_DEL_LOGIN
Body: {
  id_cliente: 5,
  tipo_pago: "efectivo",
  productos: [
    { id_producto: 2, cantidad: 3 },
    { id_producto: 7, cantidad: 1 }
  ]
}
```

**Backend procesa:**
1. `reciboCaja.router.js`: Recibe la solicitud
2. `auth.middleware.js`: Verifica que el token sea válido
3. `reciboCaja.controller.js - create()`:
   - Valida que el cliente exista
   - Valida que los productos existan
   - Valida que haya stock suficiente
   - Calcula el total de la venta (precio × cantidad)
   - Crea un registro en tabla `recibo_caja`
   - Por cada producto:
     - Crea un registro en `productos_recibo`
     - Resta la cantidad del stock en `productos`
   - Busca información del cliente y usuario

**Backend retorna:**
```
HTTP 201 - CREATED
{
  "success": true,
  "id_recibo_caja": 42,
  "total": 150000,
  "tipo_pago": "efectivo",
  "cliente": {
    "id_cliente": 5,
    "nombre": "Juan"
  },
  "productos": [
    { nombre: "Croquetas", cantidad: 3, precio: 50000 },
    { nombre: "Juguete", cantidad: 1, precio: 0 }
  ]
}
```

**Frontend recibe:**
1. Muestra mensaje "Venta registrada"
2. Actualiza el estado de la tienda
3. Vuelve a cargar el inventario para mostrar stock actualizado

---

### Flujo de Crear Cierre de Caja

**Frontend envía:**
```
POST /api/v1/cierre-caja
Header: Authorization: Bearer TOKEN
Body: {
  tipo_periodo: "diario",
  fecha_referencia: "2024-12-14",
  id_usuario: "admin123"
}
```

**Backend procesa:**
1. `cierreCaja.controller.js - create()`:
   - Calcula las fechas del período (si es diario: 2024-12-14 a 2024-12-14)
   - Busca todos los recibos en ese período
   - Calcula el total sumando todos los recibos
   - Cuenta cuántos recibos hay
   - Busca detalles de productos vendidos
   - Crea un registro de cierre
2. `cierreCaja.model.js` y `reciboCaja.model.js`: Buscan datos en base de datos

**Backend retorna:**
```
HTTP 201 - CREATED
{
  "success": true,
  "id_cierre_caja": 12,
  "tipo_periodo": "diario",
  "fecha_inicio": "2024-12-14",
  "fecha_fin": "2024-12-14",
  "total_ventas": 450000,
  "cantidad_recibos": 3,
  "resumen": {
    "desglose_pagos": {
      "efectivo": 250000,
      "tarjeta": 200000
    },
    "promedio_por_recibo": 150000
  }
}
```

**Frontend recibe:**
1. Muestra el resumen del cierre
2. Genera reportes basado en estos datos

---

## MANEJO DE ERRORES

### Estructura de Errores
Todos los errores siguen el mismo formato JSON:
```
{
  "error": {
    "code": "ERR_XYZ",
    "message": "Descripción del error",
    "field": { detalles adicionales }
  }
}
```

### Códigos HTTP
- **200 OK**: Solicitud exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Datos inválidos (falta email, SKU duplicado, etc)
- **401 Unauthorized**: No está autenticado o token inválido
- **403 Forbidden**: No tiene permisos (no es admin)
- **404 Not Found**: El recurso no existe (producto con ID 999)
- **409 Conflict**: Conflicto (usuario con email duplicado)
- **500 Internal Server Error**: Error inesperado del servidor

### Validaciones en Controladores

#### Antes de crear usuario:
- Email requerido y formato válido
- Email no debe existir
- Contraseña mínimo 6 caracteres
- Roles válidos

#### Antes de crear producto:
- SKU requerido y único
- Nombre requerido
- Stock no puede ser negativo
- Precio no puede ser negativo
- Categoría debe existir

#### Antes de crear recibo:
- Cliente debe existir
- Productos deben existir
- Stock debe ser suficiente para cada producto
- Tipo de pago válido

### Ejemplos de Errores

**Error 1: Email duplicado**
```
POST /api/v1/auth/register
{ email: "admin@test.com", password: "123456" }

Respuesta (HTTP 409):
{
  "error": {
    "code": "ERR_101",
    "message": "Correo electrónico ya existe",
    "field": { email: "admin@test.com" }
  }
}
```

**Error 2: Producto no encontrado**
```
GET /api/v1/productos/999

Respuesta (HTTP 404):
{
  "error": {
    "code": "ERR_300",
    "message": "Producto no encontrado",
    "field": { id: 999 }
  }
}
```

**Error 3: Sin stock**
```
POST /api/v1/recibo-caja
{
  id_cliente: 5,
  productos: [{ id_producto: 2, cantidad: 1000 }]
}

Respuesta (HTTP 400):
{
  "error": {
    "code": "ERR_304",
    "message": "Stock insuficiente",
    "field": {
      producto: "Croquetas",
      stockSolicitado: 1000,
      stockDisponible: 50
    }
  }
}
```

---

## RESUMEN DE FUNCIONALIDADES

### Autenticación
- Login seguro con JWT
- Registro de usuarios (solo admin)
- Tokens expiran después de tiempo
- Contraseñas encriptadas con bcrypt

### Gestión de Usuarios
- Crear, actualizar, listar, eliminar usuarios
- Asignar múltiples roles a usuarios
- Control de permisos basado en roles

### Gestión de Clientes
- Registrar clientes con información completa
- Buscar clientes por nombre, documento, etc
- Historial de compras por cliente

### Gestión de Inventario
- Crear categorías de productos
- Agregar productos con SKU único
- Actualizar precios y stock
- Buscar productos por nombre o categoría

### Ventas
- Crear recibos con múltiples productos
- Descuenta automáticamente el stock
- Permite diferentes tipos de pago
- Registra detalles de cada venta

### Reportes
- Consolidación de ventas por período
- Desglose por tipo de pago
- Totales y promedios
- Cierres diarios, semanales, mensuales

### Seguridad
- Autenticación obligatoria en rutas sensibles
- Control de permisos por rol
- Validación de datos en entrada
- Manejo consistente de errores

---

## CÓMO TRABAJA TODO JUNTO

### Flujo Completo de un Día de Trabajo

1. **Mañana:**
   - Empleado abre la aplicación
   - Hace login (frontend → backend, backend verifica)
   - Ve el dashboard (frontend solicita datos de productos, clientes, etc)

2. **Durante el día:**
   - Cliente entra a comprar
   - Empleado busca productos
   - Crea un recibo (frontend envía solicitud, backend resta stock)
   - Cliente paga
   - Se guarda la venta en base de datos

3. **Múltiples ventas:**
   - Se crean múltiples recibos
   - Cada uno actualiza el stock
   - Cada uno guarda detalles de qué se vendió

4. **Fin del día:**
   - Empleado genera cierre de caja
   - Backend calcula:
     - Total de todas las ventas del día
     - Cuántos recibos se emitieron
     - Desglose por tipo de pago
   - Se guarda el cierre en base de datos

5. **Reportes:**
   - Gerente puede ver cierres por período
   - Puede ver qué productos se vendieron más
   - Puede ver si hay discrepancias en caja

Todo este proceso es manejado por la API que:
- Recibe solicitudes del frontend
- Valida datos
- Interactúa con la base de datos
- Retorna respuestas apropiadas
- Mantiene la integridad de los datos

---

## CONCLUSIÓN

El backend de VetShop es un sistema completo que:
- **Almacena** todos los datos en MySQL
- **Valida** que los datos sean correctos
- **Protege** el acceso con autenticación y roles
- **Procesa** transacciones de ventas
- **Genera** reportes y consolidados
- **Maneja** errores de manera consistente
- **Se comunica** con el frontend mediante JSON

Cada archivo tiene un propósito específico y trabajan juntos para crear una aplicación funcional y segura.
