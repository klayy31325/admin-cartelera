// ============================================================
// socket.js — Singleton para Socket.io e integración con TV
// ============================================================
const { Server } = require('socket.io');

let _io = null;

/**
 * Inicializa la instancia de Socket.io y define los eventos base.
 * @param {import('http').Server} httpServer - Servidor HTTP nativo.
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: '*', // En prod, restringir a dominios conocidos
      methods: ['GET', 'POST']
    }
  });

  _io.on('connection', (socket) => {
    console.log(`  [WS] Nuevo cliente conectado: ${socket.id}`);

    // Registro automático de TV
    socket.on('tv:identify', async (data) => {
      try {
        const { uid, ip, departamento_id, informacion } = data;
        if (!uid) return;

        socket.tv_uid = uid; // Vincular UID al socket

        const tvRepository = require('./repositories/tv.repository');
        const result = await tvRepository.registerConnection(uid, {
          ip_address: ip,
          estado_conexion: 'online',
          departamento_id,
          informacion
        });

        // Enviar configuración a la TV (qué máquina debe mostrar)
        socket.emit('tv:config', result.config);

        console.log(`  [TV] TV Identificada: ${uid} -> Máquina: ${result.config.maquina_nombre || 'Todas'}`);
      } catch (error) {
        console.error('  [ERR] Error identificando TV:', error.message);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`  [WS] Cliente desconectado: ${socket.id}`);
      
      // Si era una TV, marcar como offline
      if (socket.tv_uid) {
        try {
          const tvRepository = require('./repositories/tv.repository');
          await tvRepository.updateStatusByUid(socket.tv_uid, 'offline');
          console.log(`  [TV] TV Offline: ${socket.tv_uid}`);
        } catch (error) {
          console.error('  [ERR] Error al poner TV offline:', error.message);
        }
      }
    });
  });

  console.log('  ✓ Socket.io inicializado');
  return _io;
}

/**
 * Retorna la instancia de Socket.io.
 */
function getIO() {
  if (!_io) throw new Error('Socket.io no ha sido inicializado.');
  return _io;
}

/**
 * Notifica a una TV específica una actualización de su configuración.
 */
function notifyTvUpdate(uid, config) {
  if (!_io) return;
  const sockets = Array.from(_io.sockets.sockets.values());
  const targetSocket = sockets.find(s => s.tv_uid === uid);
  
  if (targetSocket) {
    targetSocket.emit('tv:config', config);
    console.log(`  [WS] Configuración enviada a TV: ${uid}`);
  }
}

module.exports = { initSocket, getIO, notifyTvUpdate };
