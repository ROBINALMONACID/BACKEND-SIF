# Stack Tecnologico de `node_taller`

Este documento resume las tecnologias usadas en el backend `node_taller`, la version detectada y como se verifico dentro del proyecto.

## Resumen ejecutivo

- Tipo de proyecto: API REST backend en Node.js
- Lenguaje: JavaScript moderno con ES Modules (`"type": "module"`)
- Framework principal: Express
- Base de datos: MySQL usando Sequelize como ORM
- Autenticacion: JWT + bcrypt
- Carga de archivos: Multer
- Pruebas: `node:test` nativo de Node

## Versiones verificadas

| Tecnologia | Version | Verificacion |
| --- | --- | --- |
| Node.js instalado en entorno | `v24.11.0` | comando `node -v` |
| npm instalado en entorno | `11.6.1` | comando `npm.cmd -v` |
| Proyecto `node_taller` | `1.0.0` | `package.json` |
| JavaScript ES Modules | configurado | `package.json` con `"type": "module"` |
| Express | `^5.1.0` | dependencia en `package.json` |
| Sequelize | `^6.37.7` | dependencia en `package.json` |
| mysql2 | `^3.15.3` | dependencia en `package.json` |
| dotenv | `^17.2.3` | dependencia en `package.json` |
| jsonwebtoken | `^9.0.2` | dependencia en `package.json` |
| bcrypt | `^6.0.0` | dependencia en `package.json` |
| multer | `^2.0.2` | dependencia en `package.json` |
| cors | `^2.8.5` | dependencia en `package.json` |
| morgan | `^1.10.1` | dependencia en `package.json` |
| Faker | `^10.1.0` | dependencia en `package.json` |
| Nodemon | `^3.1.10` | `devDependency` en `package.json` |
| Motor de base de datos | `MySQL` | `connect.db.js` usa `dialect: 'mysql'` por defecto |

## Tecnologias que realmente se estan usando

### 1. Runtime y lenguaje

- Node.js como entorno de ejecucion del backend.
- JavaScript con sintaxis modular ESM.

Evidencia:

- Script de inicio: `node src/index.js`
- Script de desarrollo: `npx nodemon src/index.js`
- `package.json` declara `"type": "module"`

### 2. Framework backend

- Express se usa para construir la API REST.
- El servidor expone rutas versionadas bajo `/api/v1`.
- Tambien expone archivos estaticos bajo `/uploads`.

Evidencia:

- `src/app/app.js` importa `express`
- `src/index.js` levanta el servidor en `PORT` o `3001`

### 3. Base de datos

- Sequelize se usa como ORM.
- `mysql2` se usa como driver de conexion.
- El dialecto configurado por defecto es MySQL.

Evidencia:

- `src/config/connect.db.js` crea una instancia `new Sequelize(...)`
- `src/config/connect.db.js` usa `process.env.DB_DIALECT || 'mysql'`
- Existe `mysql_schema.sql` en la raiz del backend

Nota:

- La version exacta del servidor MySQL no aparece fija en el repositorio. Solo se puede confirmar que el proyecto esta preparado para trabajar con MySQL.

### 4. Seguridad y autenticacion

- `jsonwebtoken` se usa para emitir o validar tokens JWT.
- `bcrypt` se usa para hash de contrasenas.
- Hay middleware de autenticacion y autorizacion por roles.

Evidencia:

- `src/middleware/auth.middleware.js` usa `jwt.verify(...)`
- Existen scripts como `hashPasswords.js`, `createAdmin.js` e `insertTestUser.js`

### 5. Carga de archivos

- `multer` se usa para subir imagenes.
- Los archivos se guardan en disco dentro de `uploads/clients` y `uploads/products`.

Evidencia:

- `src/middleware/upload.middleware.js` configura `multer.diskStorage(...)`
- Limite configurado: `5MB`
- Tipos permitidos: `jpeg`, `jpg`, `png`, `gif`, `webp`

### 6. Configuracion y observabilidad

- `dotenv` carga variables desde `.env`.
- `morgan` registra peticiones HTTP.
- `cors` habilita acceso cruzado entre frontend y backend.

Evidencia:

- `src/config/connect.db.js` y `src/index.js` cargan `.env`
- `src/app/app.js` usa `morgan('dev')` y `cors()`

### 7. Testing

- El proyecto usa el runner nativo de pruebas de Node, no Jest.
- Las pruebas estan en `src/tests`.

Evidencia:

- Script: `node --test src/tests/**/*.test.js`
- `src/tests/api.smoke.test.js` importa `test` desde `node:test`

## Scripts del backend

| Script | Comando | Uso |
| --- | --- | --- |
| `start` | `node src/index.js` | arranque normal |
| `dev` | `npx nodemon src/index.js` | desarrollo con recarga |
| `test` | `node --test src/tests/**/*.test.js` | ejecucion de pruebas |

## Plan de instalacion del software

El software esta dividido en dos componentes principales:

- Backend API: `node_taller`
- Frontend web: `PETSHOP_FRONT`

El orden recomendado de instalacion es:

1. Instalar prerrequisitos del entorno.
2. Crear y configurar la base de datos MySQL.
3. Instalar y levantar el backend.
4. Instalar y levantar el frontend.
5. Validar la comunicacion entre ambos componentes.

### Prerrequisitos generales

Antes de iniciar la instalacion se requiere:

- Node.js y npm instalados.
- MySQL disponible en el equipo o en un servidor accesible.
- Un cliente para administrar MySQL, por ejemplo MySQL Workbench, phpMyAdmin o consola.
- Puertos disponibles:
  - `3001` para backend
  - `5173` para frontend con Vite
  - `3306` para MySQL si se usa configuracion local por defecto

### Instalacion del backend `node_taller`

#### 1. Ubicacion del componente

Ruta del backend:

`C:\Projects\PROYECTO-COMPLETO\node_taller`

#### 2. Instalacion de dependencias

Ejecutar en la carpeta del backend:

```powershell
cd C:\Projects\PROYECTO-COMPLETO\node_taller
npm install
```

#### 3. Creacion de la base de datos

El backend usa MySQL con Sequelize y dispone del archivo:

`mysql_schema.sql`

Proceso sugerido:

1. Crear una base de datos en MySQL.
2. Seleccionar esa base de datos.
3. Ejecutar el script `mysql_schema.sql`.

Ejemplo de referencia:

```sql
CREATE DATABASE petshop_db;
USE petshop_db;
SOURCE mysql_schema.sql;
```

Nota:

- El script crea tablas como `usuarios`, `roles`, `categorias`, `productos`, `clientes`, `recibo_caja`, `productos_recibo` y `cierres_caja`.
- Tambien inserta datos iniciales basicos en `roles` y `tipo_documento`.

#### 4. Configuracion del archivo `.env`

El backend lee sus variables desde un archivo `.env` ubicado en la raiz de `node_taller`.

Variables minimas requeridas:

```env
DB_NAME=petshop_db
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_DIALECT=mysql
PORT=3001
SEED_ON_START=false
```

Notas de configuracion:

- `DB_DIALECT` por defecto ya contempla `mysql`.
- `PORT` define el puerto del backend.
- Si `SEED_ON_START=true`, el sistema intenta insertar categorias y productos iniciales al arrancar.

#### 5. Ejecucion del backend

Modo desarrollo:

```powershell
npm run dev
```

Modo normal:

```powershell
npm start
```

#### 6. Validacion del backend

Validaciones esperadas:

- Conexion exitosa a la base de datos.
- Servidor iniciado en `http://localhost:3001`
- API disponible bajo la ruta base:

`http://localhost:3001/api/v1`

Adicionalmente, el proyecto expone archivos subidos en:

`http://localhost:3001/uploads`

### Instalacion del frontend `PETSHOP_FRONT`

#### 1. Ubicacion del componente

Ruta del frontend:

`C:\Projects\PROYECTO-COMPLETO\PETSHOP_FRONT`

#### 2. Instalacion de dependencias

Ejecutar en la carpeta del frontend:

```powershell
cd C:\Projects\PROYECTO-COMPLETO\PETSHOP_FRONT
npm install
```

#### 3. Configuracion de comunicacion con backend

El frontend ya tiene configurada la URL base del backend en:

`src/services/api.js`

Valor actual detectado:

```js
baseURL: 'http://localhost:3001/api/v1'
```

Esto significa que:

- El backend debe estar ejecutandose en `localhost`
- El backend debe usar el puerto `3001`
- La API debe mantenerse bajo el prefijo `/api/v1`

#### 4. Ejecucion del frontend

Ejecutar:

```powershell
npm run dev
```

Vite normalmente publica la aplicacion en una URL similar a:

`http://localhost:5173`

#### 5. Validacion del frontend

Validaciones esperadas:

- La aplicacion abre correctamente en el navegador.
- El login y los modulos consumen la API sin errores de conexion.
- No deben presentarse errores CORS, porque el backend usa `cors()`.

### Secuencia recomendada de despliegue local

Para una instalacion local funcional, seguir esta secuencia:

1. Instalar Node.js, npm y MySQL.
2. Ejecutar `mysql_schema.sql` en MySQL.
3. Crear el archivo `.env` del backend.
4. Ejecutar `npm install` en `node_taller`.
5. Iniciar el backend con `npm run dev`.
6. Ejecutar `npm install` en `PETSHOP_FRONT`.
7. Iniciar el frontend con `npm run dev`.
8. Abrir el frontend en navegador y validar consumo del backend.

### Riesgos o puntos de atencion en la instalacion

- Si MySQL no esta disponible o las credenciales del `.env` son incorrectas, el backend no conectara.
- Si el puerto `3001` esta ocupado, el frontend no podra consumir la API configurada.
- Si se cambia el puerto del backend, tambien debe actualizarse `src/services/api.js` en el frontend.
- Si no se ejecuta `mysql_schema.sql`, varias rutas del backend fallaran por ausencia de tablas.

### Resumen para incluir en plan de instalacion

Resumen corto sugerido:

`El proceso de instalacion del software inicia con la preparacion del entorno Node.js y MySQL. Luego se configura la base de datos del backend ejecutando el script mysql_schema.sql y creando el archivo .env con las credenciales de conexion. Despues se instalan las dependencias del backend node_taller y se inicia el servicio en el puerto 3001. Finalmente, se instalan las dependencias del frontend PETSHOP_FRONT, el cual se ejecuta con Vite y consume la API del backend mediante la URL http://localhost:3001/api/v1.`

## Conclusiones

El stack principal de `node_taller` es:

`Node.js + Express + Sequelize + MySQL + JWT + bcrypt + Multer + dotenv + Morgan + CORS + node:test`

Si necesitas, el siguiente paso que puedo hacer es prepararte esto en formato:

- tabla corta para presentar en clase
- stack visual por capas
- documento completo incluyendo `PETSHOP_FRONT` y `petshop_app`
