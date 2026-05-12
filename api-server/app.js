// ============================================================
// app.js — Punto de entrada del servidor Express
// ============================================================
require('dotenv').config();

const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { testConnection } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { initSocket } = require('./socket');

// ── Importar Rutas ──
const usuariosRoutes = require('./routes/usuarios.routes');
const authRoutes = require('./routes/auth.routes');
const tvRoutes = require('./routes/tv.routes');
const produccionRoutes = require('./routes/produccion.routes');
const catalogosRoutes = require('./routes/catalogos.routes');
const publicRoutes = require('./routes/public.routes');
const paradasRoutes = require('./routes/paradas.routes');
const desperdiciosRoutes = require('./routes/desperdicios.routes');
const trabajosRoutes = require('./routes/trabajos.routes');
const velocidadRoutes = require('./routes/velocidad.routes');
const logsRoutes = require('./routes/logs.routes');
const informacionRoutes = require('./routes/informacion.routes');

const app        = express();
const httpServer = http.createServer(app);
const PORT       = process.env.PORT || 8000;

// ══════════════════════════════════════════════════════════════
// MIDDLEWARES GLOBALES
// ══════════════════════════════════════════════════════════════

// CORS — Permitir peticiones desde cualquier origen en desarrollo
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parser de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de peticiones (Debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ══════════════════════════════════════════════════════════════
// RUTAS
// ══════════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server operativo',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Módulos Públicos
app.use('/api/public', publicRoutes);

// Módulos Protegidos
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/paradas', paradasRoutes);
app.use('/api/desperdicios', desperdiciosRoutes);
app.use('/api/trabajos', trabajosRoutes);
app.use('/api/velocidad', velocidadRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/informacion', informacionRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
  });
});

// ══════════════════════════════════════════════════════════════
// MIDDLEWARE DE ERRORES (siempre al final)
// ══════════════════════════════════════════════════════════════
app.use(errorHandler);

// ══════════════════════════════════════════════════════════════
// ARRANQUE DEL SERVIDOR
// ══════════════════════════════════════════════════════════════
async function start() {
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  CUREX API SERVER — Industrial Platform  ');
  console.log('══════════════════════════════════════════');

  // Verificar conexión a MySQL antes de levantar
  await testConnection();

  // Inicializar Socket.io sobre el mismo servidor HTTP
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`  ✓ Servidor corriendo → http://localhost:${PORT}`);
    console.log(`  ✓ WebSocket (Socket.io) activo en el mismo puerto`);
    console.log(`  ✓ CORS habilitado → ${process.env.CORS_ORIGIN || '*'}`);
    console.log('──────────────────────────────────────────');
    console.log('  Endpoints disponibles:');
    console.log('    POST   /api/usuarios       → Registrar usuario');
    console.log('    GET    /api/usuarios        → Listar usuarios (JWT)');
    console.log('    POST   /api/auth/login      → Iniciar sesión');
    console.log('    GET    /api/health           → Health check');
    console.log('    WS     /socket.io           → WebSocket en tiempo real');
    console.log('══════════════════════════════════════════');
    console.log('');
  });
}

start().catch((err) => {
  console.error('\n  ✗ No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
