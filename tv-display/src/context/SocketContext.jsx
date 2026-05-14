import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── Connection status enum ── */
export const WS_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED:  'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
};

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState(WS_STATUS.CONNECTING);
  const [lastEvent, setLastEvent] = useState(null);
  const [tvConfig, setTvConfig] = useState({ maquina_id: null, maquina_nombre: null });

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus(WS_STATUS.CONNECTED);

      // 1. Verificar si estamos en modo vista previa vía URL
      const urlParams = new URLSearchParams(window.location.search);
      const previewUid = urlParams.get('preview_uid');

      let tvUid;
      if (previewUid) {
        tvUid = previewUid;
        console.log(`[Socket] Modo Vista Previa Activo: ${tvUid}`);
      } else {
        // 2. Auto-identificación normal de la TV
        tvUid = localStorage.getItem('tv_uid');
        if (!tvUid) {
          tvUid = `TV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          localStorage.setItem('tv_uid', tvUid);
        }
      }

      console.log(`[Socket] Identificando TV: ${tvUid}`);
      socket.emit('tv:identify', {
        uid: tvUid,
        departamento_id: 2,
        informacion: previewUid ? `VISTA PREVIA - ADMIN` : `TV Display - ${tvUid}`
      });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Desconectado');
      setStatus(WS_STATUS.DISCONNECTED);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Error de conexión:', err);
      setStatus(WS_STATUS.ERROR);
    });

    socket.on('tv:config', (config) => {
      console.log('[Socket] Nueva configuración recibida:', config);
      setTvConfig(config);
    });

    /* ─ Domain events ─ */
    const EVENTS = ['production-update', 'parada-update', 'velocidad-update', 'info-update'];
    EVENTS.forEach(evt =>
      socket.on(evt, (data) => setLastEvent({ type: evt, data, ts: Date.now() }))
    );

    return () => socket.disconnect();
  }, []);

  const value = {
    socket: socketRef.current,
    status,
    lastEvent,
    tvConfig,
    emit: (event, data) => socketRef.current?.emit(event, data),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
};
