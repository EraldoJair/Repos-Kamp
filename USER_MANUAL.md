# Manual de Usuario - Sistema de Aprobación de Compras

## 1. Introducción

Este manual proporciona una guía detallada para el uso del Sistema de Aprobación de Compras, una aplicación diseñada para gestionar eficientemente las solicitudes de compra, su aprobación y el control de inventario en almacenes. El sistema facilita la comunicación en tiempo real y la toma de decisiones informada para optimizar el proceso de adquisición.

## 2. Requisitos del Sistema

Para ejecutar y desarrollar esta aplicación, necesitará tener instalados los siguientes componentes:

*   **Node.js**: Versión 18 o superior.
*   **npm** (Node Package Manager) o **Yarn**: Se instala automáticamente con Node.js.
*   **MongoDB**: Una base de datos NoSQL. Puede instalarla localmente o usar un servicio en la nube como MongoDB Atlas.

## 3. Guía de Instalación

Siga estos pasos para configurar y ejecutar la aplicación en su entorno local:

### 3.1. Clonar el Repositorio

Si el código fuente está en un repositorio Git, clónelo usando el siguiente comando:

```bash
git clone <URL_DEL_REPOSITORIO>
cd mining-purchase-approval-system
```

### 3.2. Instalación de Dependencias

El proyecto tiene dependencias tanto para el frontend como para el backend. Navegue a la raíz del proyecto y ejecute:

```bash
npm install
```

Este comando instalará todas las dependencias listadas en `package.json`.

### 3.3. Configuración de Variables de Entorno

Cree un archivo `.env` en la raíz del proyecto. Este archivo contendrá las variables de entorno necesarias para la conexión a la base de datos y otras configuraciones sensibles. Un ejemplo de `.env` podría ser:

```
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@crmprueba-shard-00-01.wozor.mongodb.net/<nombre_de_la_base_de_datos>?retryWrites=true&w=majority
JWT_SECRET=su_secreto_jwt_aqui
PORT=3001
```

Asegúrese de reemplazar `<usuario>`, `<contraseña>`, `<nombre_de_la_base_de_datos>` y `su_secreto_jwt_aqui` con sus propios valores.

### 3.4. Configuración de la Base de Datos

El sistema utiliza MongoDB. Asegúrese de que su instancia de MongoDB esté en funcionamiento y sea accesible a través de la `MONGO_URI` configurada en el archivo `.env`.

### 3.5. Siembra de Datos Iniciales (Opcional)

Para poblar la base de datos con usuarios iniciales (por ejemplo, un usuario administrador), puede ejecutar el script de siembra:

```bash
npm run seed
```

Este comando ejecutará `server/scripts/createInitialUsers.js`.

## 4. Ejecución de la Aplicación

Una vez que todas las dependencias estén instaladas y las variables de entorno configuradas, puede iniciar la aplicación:

```bash
npm run dev
```

Este comando iniciará tanto el servidor backend (en `http://localhost:3001`) como el servidor de desarrollo del frontend (generalmente en `http://localhost:5173`). Verifique la salida de la consola para la URL exacta, ya que el puerto puede variar si el 5173 está en uso.

### 4.2. Acceso a la API

La API del backend está disponible en `http://localhost:3001/api`.

## 5. Características Principales

El sistema ofrece las siguientes funcionalidades clave:

### 5.1. Autenticación y Gestión de Usuarios

*   **Inicio de Sesión**: Acceso seguro al sistema.
*   **Gestión de Usuarios**: Creación, edición y eliminación de usuarios con diferentes roles y permisos.

### 5.2. Gestión de Solicitudes de Compra

*   **Creación de Solicitudes**: Los usuarios pueden generar nuevas solicitudes de compra detallando los productos y cantidades requeridas.
*   **Cola de Aprobación**: Las solicitudes pendientes de aprobación se muestran en una cola para que los usuarios autorizados las revisen y aprueben o rechacen.
*   **Visualización de Solicitudes**: Seguimiento del estado de todas las solicitudes de compra.

### 5.3. Gestión de Almacenes e Inventario

*   **Gestión de Almacenes**: Registro y administración de diferentes ubicaciones de almacén.
*   **Gestión de Stock**: Control del inventario de productos en cada almacén.
*   **Movimientos de Stock**: Registro de entradas y salidas de productos.
*   **Recibos de Almacén**: Documentación de la recepción de mercancías.

### 5.4. Dashboard y Análisis

*   **Dashboard**: Proporciona una visión general y métricas clave del sistema, como el estado de las solicitudes y el inventario.

## 6. Solución de Problemas Comunes

*   **Problemas de Conexión a la Base de Datos**: Verifique su `MONGO_URI` en el archivo `.env` y asegúrese de que su instancia de MongoDB esté en ejecución y sea accesible.
*   **Puerto en Uso**: Si `npm run dev` falla debido a que un puerto ya está en uso, cambie el puerto en su archivo `.env` (para el backend) o en `vite.config.ts` (para el frontend, si es necesario).
*   **Errores de Dependencias**: Si encuentra errores durante `npm install`, intente limpiar la caché de npm (`npm cache clean --force`) y vuelva a intentarlo.

## 7. Soporte y Contacto

Para cualquier pregunta, problema o sugerencia, por favor contacte al equipo de desarrollo o consulte la documentación interna del proyecto.