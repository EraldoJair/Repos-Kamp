# Proyecto GEMINI
Responde siempre en Español
## Descripción
Este es un proyecto de desarrollo de programas bajo el nombre **GEMINI**. El objetivo del proyecto es "control de flujo de almacenes de el inicio de un requerimiento". Este archivo tiene como objetivo servir de guía para desarrollar, probar y documentar el código de forma eficiente.

## Estructura del Proyecto

El proyecto KampferV2 es una aplicación web de tipo Full-Stack, dividida en dos componentes principales: un frontend desarrollado con React/Vite y un backend con Node.js/Express. La comunicación entre ambos se realiza a través de una API RESTful.

---

**1. Estructura General del Proyecto:**

```
C:/Users/Eraldo Valdivia/Documents/Node/project-KampferV2/
├───.dockerignore
├───.gitignore
├───docker-compose.yml         # Orquestación de contenedores Docker
├───Dockerfile.client          # Dockerfile para el frontend
├───Dockerfile.server          # Dockerfile para el backend
├───eslint.config.js           # Configuración de ESLint
├───index.html                 # Punto de entrada HTML del frontend
├───package-lock.json
├───package.json               # Dependencias y scripts del proyecto (root)
├───postcss.config.js
├───tailwind.config.js         # Configuración de Tailwind CSS
├───tsconfig.app.json
├───tsconfig.json
├───tsconfig.node.json
├───vite.config.ts             # Configuración de Vite (frontend)
├───dist/                      # Build de la aplicación (generado)
├───excel/                     # Archivos Excel (posiblemente para importación/exportación)
├───node_modules/              # Dependencias de Node.js (root)
├───server/                    # Directorio del Backend (Node.js/Express)
│   ├───index.js               # Punto de entrada del servidor
│   ├───package-lock.json
│   ├───package.json           # Dependencias del servidor
│   ├───config/
│   │   └───database.js        # Configuración de la base de datos (MongoDB)
│   ├───middleware/
│   │   ├───auth.js            # Middleware de autenticación
│   │   └───errorHandler.js    # Middleware de manejo de errores
│   ├───models/                # Modelos de Mongoose para la base de datos
│   │   ├───ApprovalRule.js
│   │   ├───backupPurchaseRequest.js
│   │   ├───backupUser.js
│   │   ├───Product.js
│   │   ├───PurchaseRequest.js
│   │   ├───Stock.js
│   │   ├───StockMovement.js
│   │   ├───User.js
│   │   ├───Warehouse.js
│   │   └───WarehouseReceipt.js
│   ├───node_modules/
│   ├───routes/                # Rutas de la API
│   │   ├───auth.js
│   │   ├───purchases.js
│   │   ├───users.js
│   │   └───warehouses.js
│   └───scripts/               # Scripts de utilidad (seed, diagnóstico, etc.)
│       ├───createInitialUsers.js
│       ├───debugConnection.js
│       ├───deleteUsers.js
│       ├───detailedSeedDebug.js
│       ├───diagnostic.js
│       ├───seedData.js
│       └───testConnection.js
└───src/                       # Directorio del Frontend (React/Vite)
    ├───App.tsx                # Componente principal de la aplicación
    ├───index.css              # Estilos globales
    ├───main.tsx               # Punto de entrada de la aplicación React
    ├───vite-env.d.ts
    ├───components/            # Componentes reutilizables de la UI
    │   ├───Analytics.tsx
    │   ├───ApprovalQueue.tsx  # Cola de aprobación (donde se gestionan las aprobaciones)
    │   ├───CreateRequest.tsx
    │   ├───Dashboard.tsx
    │   ├───Layout.tsx
    │   ├───Login.tsx
    │   ├───PurchaseRequests.tsx # Listado y gestión de solicitudes de compra
    │   ├───UserManagement.tsx
    │   └───Warehouse.tsx
    ├───hooks/                 # Hooks personalizados de React
    │   └───useSocket.ts
    ├───store/                 # Gestión de estado global (Zustand)
    │   ├───authStore.ts       # Estado de autenticación del usuario
    │   ├───purchaseStore.ts   # Estado y lógica de solicitudes de compra
    │   ├───warehouseStore.ts  # Estado y lógica de almacenes
    │   └───productStore.ts    # Estado y lógica de productos (recién añadido)
    └───utils/
        └───apiError.ts        # Utilidades para manejo de errores de API
```

---

**2. Funcionamiento del Frontend (src/):**

*   **Tecnología:** React con Vite (para desarrollo rápido y bundling) y TypeScript. Utiliza Tailwind CSS para estilos.
*   **Punto de Entrada:** `main.tsx` renderiza el componente `App.tsx`.
*   **`App.tsx`:** Probablemente contiene la configuración de rutas (usando `react-router-dom`) y el `Layout` principal de la aplicación.
*   **`components/`:** Contiene los bloques de construcción de la interfaz de usuario.
    *   `Login.tsx`: Maneja la autenticación de usuarios.
    *   `Dashboard.tsx`: Vista principal después del login.
    *   `PurchaseRequests.tsx`: Muestra y permite interactuar con las solicitudes de compra.
    *   `ApprovalQueue.tsx`: Componente crítico donde los usuarios con permisos de aprobación pueden revisar y aprobar/rechazar solicitudes. Aquí se implementa la lógica de validación de campos como `receiptNumber`, `warehouseId`, `productId` antes de la aprobación final.
    *   `CreateRequest.tsx`: Formulario para crear nuevas solicitudes de compra.
    *   `UserManagement.tsx`: Interfaz para la gestión de usuarios.
    *   `Warehouse.tsx`: Componente relacionado con la gestión de almacenes.
*   **`store/` (Zustand):** Centraliza la gestión del estado de la aplicación.
    *   `authStore.ts`: Almacena el token de autenticación del usuario, información del usuario logueado y sus permisos.
    *   `purchaseStore.ts`: Maneja el estado de las solicitudes de compra (fetching, creación, actualización, aprobación, rechazo, asignación a almacén). Contiene la lógica para interactuar con la API de `/purchases`.
    *   `warehouseStore.ts`: Gestiona el estado de los almacenes disponibles.
    *   `productStore.ts`: (Recién añadido) Gestiona el estado de los productos disponibles, permitiendo su selección en formularios.
*   **`hooks/`:** Contiene hooks personalizados, como `useSocket.ts` para comunicación en tiempo real.
*   **`utils/`:** Utilidades generales, como `apiError.ts` para un manejo consistente de errores de la API.

---

**3. Funcionamiento del Backend (server/):**

*   **Tecnología:** Node.js con Express.js. Utiliza Mongoose para la interacción con MongoDB.
*   **Punto de Entrada:** `index.js` configura el servidor Express, conecta a la base de datos y monta las rutas de la API.
*   **`config/database.js`:** Contiene la configuración de conexión a la base de datos MongoDB.
*   **`middleware/`:** Funciones que se ejecutan antes de que las solicitudes lleguen a los controladores de ruta.
    *   `auth.js`: Verifica los tokens de autenticación (JWT) y establece el usuario en el objeto de solicitud.
    *   `errorHandler.js`: Captura y procesa errores de la aplicación, enviando respuestas estandarizadas al cliente.
*   **`models/`:** Define los esquemas de datos para MongoDB utilizando Mongoose. Cada archivo representa una colección en la base de datos (e.g., `User`, `PurchaseRequest`, `Product`, `Warehouse`).
*   **`routes/`:** Define los endpoints de la API y asocia las URLs con las funciones controladoras.
    *   `auth.js`: Rutas para registro, login y gestión de sesiones.
    *   `purchases.js`: Rutas para CRUD de solicitudes de compra, incluyendo aprobación, rechazo y asignación a almacén. Aquí es donde el backend recibe los datos validados del frontend.
    *   `users.js`: Rutas para CRUD de usuarios.
    *   `warehouses.js`: Rutas para CRUD de almacenes.
*   **`scripts/`:** Contiene scripts de mantenimiento y desarrollo, como `seedData.js` para poblar la base de datos con datos de prueba, o `diagnostic.js` para verificar el estado del sistema.

---

**4. Flujo de Trabajo Típico:**

1.  **Autenticación:** El usuario accede a la aplicación, se autentica a través del componente `Login.tsx`. El `authStore` maneja el estado de autenticación y guarda el token JWT.
2.  **Creación de Solicitud:** Un usuario crea una nueva solicitud de compra usando `CreateRequest.tsx`. Los datos se envían al backend a través de `purchaseStore.ts`, que interactúa con la API `/api/purchases`.
3.  **Cola de Aprobación:** La solicitud entra en un flujo de aprobación. Los usuarios con roles de aprobación (ej. `jefe_almacen`, `gerente`) ven las solicitudes pendientes en `ApprovalQueue.tsx`.
4.  **Aprobación/Rechazo:**
    *   Cuando un aprobador decide "Aprobar" una solicitud, el frontend (`ApprovalQueue.tsx`) realiza validaciones adicionales (ej. `receiptNumber`, `warehouseId`, `productId` si la solicitud requiere asignación de almacén).
    *   Si las validaciones pasan, la acción se envía al backend a través de `purchaseStore.ts` (función `approveRequest` o `assignWarehouse`), que interactúa con el endpoint `/api/purchases/:id/action` o `/api/purchases/:id/assign-warehouse`.
    *   El backend actualiza el estado de la solicitud en la base de datos y, si es necesario, realiza la asignación de almacén y producto.
    *   Si se rechaza, se requieren comentarios y la solicitud se actualiza con el estado de rechazo.
5.  **Gestión de Datos:** Los componentes del frontend (`PurchaseRequests.tsx`, `UserManagement.tsx`, `Warehouse.tsx`) obtienen y muestran datos del backend a través de sus respectivos stores (ej. `purchaseStore`, `warehouseStore`, `productStore`), que a su vez llaman a los endpoints de la API correspondientes.

---

**5. Orquestación con Docker:**

*   `docker-compose.yml`: Define cómo se construyen y ejecutan los servicios de frontend y backend en contenedores Docker, facilitando el despliegue y el entorno de desarrollo consistente.
*   `Dockerfile.client` y `Dockerfile.server`: Contienen las instrucciones para construir las imágenes Docker de cada parte de la aplicación.

---

**Conclusión:**

El proyecto KampferV2 sigue una arquitectura modular y escalable, separando claramente las responsabilidades del frontend y el backend. El uso de Zustand para la gestión de estado en el frontend y Mongoose/Express en el backend, junto con la orquestación Docker, proporciona una base sólida para una aplicación de gestión de solicitudes de compra. La reciente adición de validaciones y la gestión de productos en el flujo de asignación de almacén mejora la integridad de los datos y la robustez del sistema.

---
