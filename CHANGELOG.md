# Changelog

## [0.2.0] — 2026-06-18

### Added
- Export modal con selector de máquina (OLYMPIA / NOVOFLEX / Todas) y rango de fechas
- Nuevo Excel de resumen mensual con dos secciones: **RESUMEN MENSUAL** y **TOTALES PARADAS**
- Fallback a agregación dinámica desde `trabajos` cuando `resumen_excel` no tiene datos
- Métodos de agregación SQL: `getResumenAggregated` y `getParadasAggregated`
- Página de administración de usuarios (`/admin/usuarios`)
- Documentación del proyecto (`DOCUMENTACION.md`)

### Changed
- Reemplazado el export detallado de trabajos por el nuevo export de resumen
- Mejora en `excel-import-form` para detectar columnas de Novoflex automáticamente
- Ajustes en `totales-form` y `produccion-informativa-manager`
- Actualización de slides en TV display

### Fixed
- Autenticación en middleware para rutas protegidas

## [0.1.0] — 2026-06-15

### Added
- Sidebar dinámico con navegación basada en roles
- Refactor del sistema de autenticación
- Rediseño de slides para TV display
- Soporte para websockets en cartelera digital

### Changed
- Estabilización general del sistema (etiquetado como `estable 3.0`)

## [0.1.0-beta.2] — 2026-06-04

### Added
- Base de datos normalizada v2.0 con tablas: `resumen_excel`, `totales_paradas`, `metas_parada`
- Endpoints públicos para dashboard TV
- Migraciones de base de datos

### Changed
- Refactor de importación Excel con parser desacoplado (`ExcelTrabajoParser`)

## [0.1.0-beta.1] — 2026-06-01

### Added
- Carga manual de totales mensuales
- Importación de archivos Excel con resumen de paradas
- Visualización de producción en TV display

## [0.1.0-alpha] — 2026-04-29

### Added
- Configuración inicial del proyecto
- Estructura base: Next.js 14 + Express API + MySQL
- Autenticación JWT
- CRUD básico de trabajos
- Integración con XAMPP (MariaDB)
