import { useSocket, WS_STATUS } from '../context/SocketContext';

const STATUS_MAP = {
  [WS_STATUS.CONNECTED]:    { label: 'ESTADO: CONECTADO', color: 'var(--col-success)', dot: true },
  [WS_STATUS.CONNECTING]:   { label: 'ESTADO: CONECTANDO...', color: 'var(--col-warn)',    dot: true },
  [WS_STATUS.DISCONNECTED]: { label: 'ESTADO: DESCONECTADO',       color: 'var(--col-danger)',  dot: false },
  [WS_STATUS.ERROR]:        { label: 'ESTADO: ERROR',         color: 'var(--col-danger)',  dot: false },
};

export default function ConnectionBadge() {
  const { status } = useSocket();
  const { label, color, dot } = STATUS_MAP[status] || STATUS_MAP[WS_STATUS.DISCONNECTED];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 10,
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      letterSpacing: '0.05em',
      color: 'var(--col-text-primary)'
    }}>
      {dot && (
        <div style={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          animation: status === WS_STATUS.CONNECTED ? 'pulse 2s infinite' : 'none'
        }} />
      )}
      <span style={{ color, fontWeight: status === WS_STATUS.ERROR || status === WS_STATUS.DISCONNECTED ? 700 : 600 }}>{label}</span>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
