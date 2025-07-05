
# ArchiAll - Explicación de la estructura del proyecto

Este proyecto está dividido en dos partes principales: `client` (frontend) y `server` (backend).

## client/
Aplicación web hecha en React para la gestión de usuarios, archivos y repositorios.

- **public/**: Archivos estáticos y recursos (imágenes, videos, favicon, etc).
- **src/**: Código fuente de React.
  - **App.js**: Componente principal de la aplicación.
  - **index.js**: Punto de entrada de React.
  - **Login.js / Register.js**: Formularios de inicio de sesión y registro de usuarios.
  - **Menu.js**: Menú principal de navegación.
  - **ProtectedRoute.js**: Protege rutas que requieren autenticación.
  - **Cookies.js**: Manejo de cookies para sesiones.
  - **Validaciones.js**: Funciones de validación de formularios.
  - **Admin/**: Componentes para el panel de administración.
  - **style/**: Archivos CSS para los estilos de la app.

## server/
Backend en Node.js/Express que gestiona la lógica de negocio, base de datos y seguridad.

- **index.js**: Configura el servidor, importa rutas y aplica middlewares globales.
- **routes/**: Define los endpoints de la API y delega la lógica a los controladores.
  - **userRoutes.js**: Rutas de usuarios, login, perfil, notificaciones, administración.
  - **uploadRoutes.js**: Rutas para subir, descargar y eliminar archivos.
  - **repoRoutes.js**: Rutas para crear y consultar repositorios.
  - **shareRoutes.js**: Rutas para compartir archivos entre usuarios.
- **controllers/**: Lógica de negocio de cada endpoint.
  - **userController.js**: Registro, login, perfil, administración y notificaciones.
  - **uploadController.js**: Subida, descarga y eliminación de archivos, validaciones de seguridad.
  - **repoController.js**: Creación y consulta de repositorios.
  - **shareController.js**: Compartir, aceptar y rechazar archivos compartidos.
- **utils/**: Utilidades y servicios auxiliares.
  - **db.js**: Conexión a la base de datos MySQL.
  - **nsfw.js**: Detección de contenido +18 en imágenes y videos usando IA.
  - **clamav.js**: Escaneo antivirus de archivos subidos.

---
