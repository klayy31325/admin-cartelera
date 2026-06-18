# DOCUMENTACIÓN DEL SISTEMA — ADMIN CARTELERA

## Descripción Breve del Proyecto

Sistema integral de monitoreo industrial diseñado para la visualización en tiempo real de estadísticas de producción en pantallas TV dentro de planta. Permite la gestión y administración centralizada de datos productivos (metros producidos, paradas, velocidad, desperdicios) de máquinas de impresión flexográfica, con actualización en vivo mediante WebSockets. Desarrollado para las empresas **CUREX C.A.** y **MORROCEL C.A.**, plantas de impresión y laminación.

---

## Objetivos del Proyecto Actual

- Proveer un panel de administración web para gestionar dispositivos TV, producción, paradas, velocidades, desperdicios y catálogos.
- Mostrar dashboards rotativos en pantallas TV con datos en tiempo real del piso de planta.
- Sincronizar datos de producción diaria, mensual y agregada por máquina.
- Permitir importación de datos desde archivos Excel para totales mensuales.
- Facilitar la vinculación de pantallas TV a máquinas específicas para visualización focalizada.
- Proveer retroalimentación visual con alertas cuando los KPI superan límites establecidos.

---

## Métodos Aplicados de Recopilación de Información

### Observación

El sistema recopila información de producción a través de:
- **Registro manual** en el panel de administración (carga de trabajos, paradas, velocidad, desperdicios).
- **Importación de archivos Excel** (`.xlsx`) con totales mensuales pre-calculados por máquina.
- **Conexión WebSocket en tiempo real** desde las pantallas TV, que se auto-identifican y reciben configuraciones.
- **Vistas SQL** (`v_produccion_hoy`, `v_paradas_hoy`, `vista_gestion_general`) que agregan datos diarios automáticamente desde los registros de `trabajos`.

---

## Solución - Desarrollo de un Nuevo Proyecto

### Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    RED LOCAL                          │
│                                                       │
│  ┌──────────────┐    ┌──────────────┐                │
│  │  Admin App   │    │  TV Display  │                │
│  │  Next.js 14  │    │  Vite+React  │                │
│  │  :3000       │    │  :5173       │                │
│  └──────┬───────┘    └──────┬───────┘                │
│         │                   │                         │
│         └────────┬──────────┘                         │
│                  │ HTTP REST + WebSocket              │
│          ┌───────┴────────┐                           │
│          │  API Server     │                           │
│          │  Express + WS   │                           │
│          │  :8000          │                           │
│          └───────┬────────┘                           │
│                  │                                    │
│          ┌───────┴────────┐                           │
│          │  MySQL (XAMPP)  │                           │
│          │  admin_cartelera│                           │
│          └────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### Objetivos Específicos

1. **Gestión de Dispositivos TV** — Registrar, editar, eliminar y monitorear TVs vinculadas por máquina.
2. **Registro de Producción** — CRUD de trabajos con metros, tiempos, clientes y productos.
3. **Control de Paradas** — Registro de paradas por motivo con límites configurables por máquina/mes.
4. **Monitoreo de Velocidad** — Velocidad teórica vs real por trabajo, con series diarias.
5. **Control de Desperdicios** — Desperdicio en kg y ml, con porcentajes y alertas.
6. **Dashboard TV** — Presentación rotativa de KPIs en pantallas (producción, velocidad, desperdicio, información).
7. **Información Diaria** — Avisos y noticias publicadas para mostrar en las TVs.
8. **Producción Informativa** — Tareas diarias asignadas a máquinas con estados.
9. **Importación Excel** — Carga masiva de totales mensuales desde archivos Excel.
10. **Exportación de Datos** — Descarga de trabajos en formato Excel.
11. **Autenticación y Roles** — Login con JWT, roles: admin, editor, operador, visor.

---

## Alcance del Proyecto

### Partes del Negocio o Proceso Afectadas

| Área | Impacto |
|------|---------|
| **Producción** | Registro de trabajos, metros producidos, paradas, velocidad, desperdicios |
| **Calidad** | Seguimiento de observaciones y defectos por trabajo |
| **Supervisión de Planta** | Visualización en tiempo real en pantallas TV |
| **Gerencia/Administración** | Dashboard mensual con KPIs, exportación de datos |
| **Mantenimiento** | Registro de paradas por mantenimiento, limpieza general |
| **Planificación** | Seguimiento de pedidos, estados de trabajo, metas |

### Máquinas Monitoreadas

| Máquina | Tipo |
|---------|------|
| OLYMPIA | Máquina de impresión flexográfica |
| NOVOFLEX | Máquina de impresión flexográfica |

### Empresas

| Empresa | ID |
|---------|----|
| CUREX C.A. | 2 |
| MORROCEL C.A. | 1 |

---

## Comunicación

### Interesados en el Proyecto (Stakeholders)

| Rol | Descripción |
|-----|-------------|
| **Administradores de Planta** | Usuarios con rol `admin` — gestión completa del sistema |
| **Supervisores de Producción** | Rol `editor` — gestión de datos productivos |
| **Operadores de Máquina** | Rol `operador` — carga de datos e importación Excel |
| **Gerencia** | Rol `visor` — visualización de datos sin edición |
| **Personal de Planta** | Visualización pasiva en pantallas TV |

### Medios de Comunicación del Proyecto

- **Web App (Next.js)**: Interfaz de administración accesible desde navegador en la red local.
- **Pantallas TV (Vite/React)**: Visualización rotativa de dashboards en TVs conectadas a la red.
- **WebSocket**: Comunicación bidireccional en tiempo real para actualización inmediata de datos.
- **API REST**: Endpoints HTTP para operaciones CRUD.
- **Consola (logs del servidor)**: Monitoreo técnico de operaciones del sistema.

---

## Tecnología

### Lenguaje de Programación

**JavaScript (Node.js)** — Tanto en frontend como backend, unificado en un solo lenguaje.

### Frameworks

| Componente | Framework | Versión |
|------------|-----------|---------|
| **Admin App** | Next.js 14.2 (App Router) | 14.2.35 |
| **API Server** | Express.js + Socket.io | 4.21.2 / 4.8.3 |
| **TV Display** | Vite + React 19 + React Router 7 | Vite 8, React 19.2 |
| **Estilos** | Tailwind CSS 3.4 + shadcn/ui | 3.4.1 |
| **Animaciones** | Framer Motion | 12.38 |
| **Gráficas** | Recharts | 3.8.1 |
| **Forms** | React Hook Form + Zod | 7.74 / 4.3 |
| **PWA** | Vite PWA Plugin (Workbox) | 1.3.0 |

### Base de Datos

| Motor | Versión | Nombre BD |
|-------|---------|-----------|
| **MySQL (MariaDB via XAMPP)** | 10.4.32-MariaDB | `admin_cartelera` |

**Esquema de Base de Datos — 15 tablas:**

| Tabla | Propósito |
|-------|-----------|
| `empresas` | Empresas registradas (CUREX, MORROCEL) |
| `departamentos` | Departamentos (Producción, Sistemas, etc.) |
| `roles` | Roles de usuario (admin, operador, visor) |
| `usuarios` | Usuarios del sistema con credenciales |
| `maquinas` | Máquinas de producción (OLYMPIA, NOVOFLEX) |
| `clientes` | Clientes de la empresa |
| `productos` | Productos fabricados, vinculados a clientes |
| `destinos` | Destinos de producción (Corte, Laminación) |
| `estados_trabajo` | Estados (Proceso, Repetición, Aprobación, etc.) |
| `turnos` | Turnos (A, B, C) |
| `trabajos` | Registro principal de producción por trabajo |
| `paradas_trabajo` | Paradas asociadas a cada trabajo por motivo |
| `motivos_parada` | Catálogo de motivos de parada (18 motivos) |
| `velocidad` | Velocidad teórica y real por trabajo |
| `desperdicios` | Desperdicio en kg y ml por trabajo |
| `tvs` | Dispositivos TV registrados y su configuración |
| `informacion_diaria` | Avisos y noticias para mostrar en TVs |
| `produccion_informativa` | Tareas diarias asignadas por máquina |

**Vistas SQL:**
- `v_produccion_hoy` — Producción del día agregada por máquina
- `v_paradas_hoy` — Paradas del día por motivo
- `vista_gestion_general` — Vista consolidada de gestión

### Servidor

| Componente | Tecnología | Puerto |
|------------|-----------|--------|
| **API Server** | Express.js + HTTP nativo + Socket.io | `8000` |
| **Admin App (Next.js)** | Servidor de desarrollo Next.js | `3000` |
| **TV Display (Vite)** | Servidor de desarrollo Vite | `5173` |
| **Base de Datos** | XAMPP MySQL (MariaDB) | `3306` |

### Estructura del Proyecto

```
admin cartelera/
├── api-server/                    # Backend API REST (Express)
│   ├── app.js                     # Punto de entrada
│   ├── socket.js                  # WebSocket (Socket.io)
│   ├── config/db.js               # Pool MySQL
│   ├── controllers/               # Controladores (9)
│   ├── services/                  # Lógica de negocio (8)
│   ├── repositories/              # Acceso a datos (13)
│   ├── routes/                    # Rutas Express (13)
│   ├── middlewares/                # Auth + Error Handler
│   ├── utils/                     # Constantes, AppError
│   ├── migrations/                # Scripts DB
│   ├── scratch/                   # Scripts auxiliares
│   └── .env                       # Config (DB, JWT, CORS)
│
├── src/                           # Admin App (Next.js 14)
│   ├── app/
│   │   ├── page.tsx               # Login / Registro
│   │   ├── layout.tsx             # Layout raíz (ThemeProvider, AuthProvider)
│   │   └── admin/
│   │       ├── layout.tsx         # Layout admin (Sidebar, fondo dinámico)
│   │       ├── page.tsx           # Dashboard TV Devices
│   │       ├── production/        # Gestión de producción + Excel
│   │       ├── catalogs/          # Catálogos (clientes, productos, máquinas)
│   │       ├── informations/      # Información diaria
│   │       ├── produccion-informativa/  # Tareas de producción
│   │       ├── logs/              # Registros del sistema
│   │       └── settings/          # Configuración
│   ├── components/                # Componentes UI (formularios, listas)
│   ├── lib/                       # Utilidades (api-config, schemas, prisma)
│   └── middleware.ts              # Next.js middleware
│
├── tv-display/                    # TV Display (Vite + React)
│   ├── src/
│   │   ├── main.jsx               # Entry point (QueryClient, SocketProvider)
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Ppal: slides rotativos, focus manager, remoto
│   │   │   ├── slides/
│   │   │   │   ├── SlideGeneralDashboard.jsx  # KPIs generales (metros, paradas, desp)
│   │   │   │   ├── SlideVelocity.jsx          # Velocidad unitaria
│   │   │   │   ├── SlideProductionInfo.jsx    # Producción diaria / tareas
│   │   │   │   ├── SlideInfo.jsx              # Avisos e información
│   │   │   │   ├── SlideTopProducts.jsx       # Top productos
│   │   │   │   ├── SlideWaste.jsx             # Desperdicios
│   │   │   │   ├── SlideProduction.jsx        # Producción
│   │   │   │   ├── SlideMachineFocus.jsx      # Enfoque por máquina
│   │   │   │   └── SlidePendingConfiguration.jsx # Espera de configuración
│   │   │   ├── TopBar.jsx         # Barra superior con navegación
│   │   │   ├── ConnectionBadge.jsx # Indicador de conexión
│   │   │   ├── Login.jsx          # Login TV (opcional)
│   │   │   └── ProductionChart.jsx # Gráficos de producción
│   │   ├── context/SocketContext.jsx # Proveedor WebSocket
│   │   └── config/api-config.js   # URL dinámica de API
│   ├── vite.config.js             # PWA + Workbox cache
│   └── .env                       # Variables de entorno
│
├── admin_cartelera (1).sql       # Dump completo de la BD
└── DOCUMENTACION.md               # Este documento
```

---

## API REST — Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check del servidor |
| `GET` | `/api/public/maquinas` | Lista de máquinas activas |
| `GET` | `/api/public/dashboard?maquina_id=N` | Dashboard completo (diario + mensual) |
| `GET` | `/api/public/informacion` | Avisos activos |
| `GET` | `/api/public/produccion-informativa` | Tareas de producción |
| `GET` | `/api/public/resumen-excel` | Totales pre-calculados desde Excel |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Inicio de sesión (retorna JWT) |

### Usuarios (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/usuarios` | Todos | Listar usuarios |
| `POST` | `/api/usuarios` | admin | Registrar usuario |
| `PUT` | `/api/usuarios/:id` | admin | Actualizar usuario |
| `DELETE` | `/api/usuarios/:id` | admin | Eliminar usuario |

### Dispositivos TV (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/tv` | Todos | Listar TVs |
| `GET` | `/api/tv/:id` | Todos | Detalle de TV |
| `POST` | `/api/tv` | admin | Registrar TV |
| `PUT` | `/api/tv/:id` | admin | Actualizar TV (asignar máquina, estado) |
| `DELETE` | `/api/tv/:id` | admin | Eliminar TV |

### Producción (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/produccion/summary-today` | Todos | Resumen del día |
| `GET` | `/api/produccion/summary-month` | Todos | Resumen del mes |
| `GET` | `/api/produccion` | Todos | Listar producción |
| `GET` | `/api/produccion/:id` | Todos | Detalle |
| `POST` | `/api/produccion` | admin, editor | Crear |
| `PUT` | `/api/produccion/:id` | admin, editor | Actualizar |
| `DELETE` | `/api/produccion/:id` | admin, editor | Eliminar |

### Catálogos (requiere JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/catalogos` | Listar todos los catálogos |
| `GET` | `/api/catalogos/clientes` | Clientes |
| `GET` | `/api/catalogos/productos` | Productos |
| `GET` | `/api/catalogos/maquinas` | Máquinas |
| `POST` | `/api/catalogos` | Crear (admin) |

### Paradas (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/paradas` | Todos | Listar |
| `POST` | `/api/paradas` | admin, editor | Crear |
| `PUT` | `/api/paradas/:id` | admin, editor | Actualizar |
| `DELETE` | `/api/paradas/:id` | admin, editor | Eliminar |

### Desperdicios (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/desperdicios` | Todos | Listar |
| `POST` | `/api/desperdicios` | admin, editor | Crear |
| `PUT` | `/api/desperdicios/:id` | admin, editor | Actualizar |
| `DELETE` | `/api/desperdicios/:id` | admin, editor | Eliminar |

### Velocidad (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/velocidad` | Todos | Listar |
| `POST` | `/api/velocidad` | admin, editor | Crear |
| `PUT` | `/api/velocidad/:id` | admin, editor | Actualizar |
| `DELETE` | `/api/velocidad/:id` | admin, editor | Eliminar |

### Trabajos (requiere JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/trabajos` | Todos | Listar con filtros |
| `GET` | `/api/trabajos/export` | Todos | Exportar a Excel |
| `POST` | `/api/trabajos` | admin, editor | Crear |
| `PUT` | `/api/trabajos/:id` | admin, editor | Actualizar |
| `DELETE` | `/api/trabajos/:id` | admin, editor | Eliminar |

### Información / Producción Informativa

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/informacion` | Listar avisos |
| `POST` | `/api/informacion` | Crear aviso |
| `GET` | `/api/produccion-informativa` | Listar tareas |
| `POST` | `/api/produccion-informativa` | Crear tarea |

### Logs

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/logs` | Listar logs del sistema |

---

## WebSocket (Socket.io)

### Eventos Cliente → Servidor

| Evento | Datos | Descripción |
|--------|-------|-------------|
| `tv:identify` | `{ uid, departamento_id, informacion, ip }` | TV se registra y recibe configuración |

### Eventos Servidor → Cliente

| Evento | Datos | Descripción |
|--------|-------|-------------|
| `tv:config` | `{ maquina_id, maquina_nombre }` | Configuración asignada a la TV |
| `production-update` | `{ ... }` | Actualización de producción |
| `parada-update` | `{ ... }` | Actualización de paradas |
| `velocidad-update` | `{ ... }` | Actualización de velocidad |
| `info-update` | `{ ... }` | Actualización de información |
| `produccion-info-update` | `{ ... }` | Actualización de tareas |

---

## Dashboard TV — Slides Rotativos

| Slide | Duración | Contenido |
|-------|----------|-----------|
| **General Dashboard** | 50s | KPIs: Metros mensuales, % desperdicio M/L, % desperdicio KG, paradas por motivo con barras y límites |
| **Velocidad Unitaria** | 15s | Velocidad teórica vs real con gráfico de series |
| **Producción Diaria** | 50s | Tareas de producción informativa asignadas |
| **Información** | 50s | Avisos y noticias activas |

**Características especiales:**
- Control remoto mediante teclas de color (Rojo: tema, Verde: refresh, Amarillo: pausa, Azul: fullscreen)
- Navegación numérica (1-9) para saltar a slides
- Soporte para Smart TVs (detección de user-agent)
- PWA con Service Worker para caché offline
- Auto-recarga si la conexión WebSocket se pierde por más de 20s
- Animaciones GPU optimizadas con Framer Motion

---

## Seguridad

- **Autenticación**: JWT (JSON Web Tokens) con expiración de 8 horas
- **Roles**: admin, editor, operador, visor (control de acceso por endpoint)
- **Contraseñas**: Hash con bcryptjs (10 rounds)
- **CORS**: Configurable, por defecto permite todos los orígenes
- **Validación**: Zod schemas en frontend, validación manual en backend

---

## Configuración del Entorno

### `api-server/.env`

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=admin_cartelera
DB_PORT=3306
PORT=8000
JWT_SECRET=curex_industrial_secret_key_2024_xA482
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:3000
```

### `tv-display/.env`

```
VITE_API_URL=http://192.168.1.114:8000   # Opcional, auto-detected si no se define
```

---

## Cómo Ejecutar el Proyecto

### 1. Base de Datos
```bash
# Importar el dump SQL en XAMPP MySQL
mysql -u root admin_cartelera < "admin_cartelera (1).sql"
```

### 2. API Server (puerto 8000)
```bash
cd api-server
npm install
npm start          # node app.js
npm run dev        # node --watch app.js
```
El servidor se conecta a MySQL e inicializa Socket.io.

### 3. Admin App - Next.js (puerto 3000)
```bash
cd admin_cartelera   # raíz del proyecto
npm install
npm run dev         # next dev -H 0.0.0.0
```
Acceder vía `http://localhost:3000`

### 4. TV Display (puerto 5173)
```bash
cd tv-display
npm install
npm run dev         # vite --host
```
Abrir en navegador o TV: `http://localhost:5173`
- `http://localhost:5173?maquina_id=1` para mostrar OLYMPIA
- `http://localhost:5173?maquina_id=2` para mostrar NOVOFLEX

---

## Usuarios por Defecto

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| `klay@gmail.com` | (encriptada en BD) | admin |
| `cartelera@curex.com` | (encriptada en BD) | visor |

---

## Funcionalidades Clave del Dashboard TV

### Fallback Automático de Datos Mensuales
Si el mes actual no tiene datos de producción, el dashboard usa automáticamente los datos del mes anterior, mostrando una etiqueta "MES ANTERIOR".

### Override con Datos de Excel
Cuando se importan totales mensuales desde Excel, el dashboard reemplaza los valores calculados por los valores exactos del archivo, incluyendo desglose de paradas.

### Alertas Visuales
- Los indicadores de desperdicio cambian a rojo cuando superan el 8% límite.
- Las barras de paradas muestran línea de límite y cambio de color cuando se excede.
- Efecto de pulso en tarjetas que exceden límites.

### Enfoque por Máquina
Cada TV puede configurarse para mostrar datos de una máquina específica (OLYMPIA o NOVOFLEX) o todas las máquinas en general.


### ARRANQUE DE APP EN TV
-Debe tener las siguientes aplicaciones
SO: 
Android para TVs.

APLICACIONES: 
LAUNCHER GESTOR DE INICIO AUTOMATICO V7.3.0.
NAVEGADOR: FULLY WEB BROWSR V1.60.1
