import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

import SlideGeneralDashboard from './slides/SlideGeneralDashboard';
import SlideMachineFocus from './slides/SlideMachineFocus';
import SlideTopProducts from './slides/SlideTopProducts';
import SlideInfo from './slides/SlideInfo';
import TopBar from './TopBar';
import Login from './Login';

const SLIDE_DURATION = 20_000; // 20 segundos

const SLIDES = [
  { id: 'general',   label: 'Vista General',  Component: SlideGeneralDashboard },
  { id: 'focus',     label: 'Enfoque Máquina', Component: SlideMachineFocus },
  { id: 'info',      label: 'Información',    Component: SlideInfo },
  { id: 'productos', label: 'Top Productos',  Component: SlideTopProducts },
];

/* Framer-motion variants — horizontal slide with spatial continuity */
const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchDashboard(maquina_id = null) {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7); // YYYY-MM
  const token = localStorage.getItem('curex_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  // Construir URLs dinámicamente según si hay una máquina enfocada
  const baseUrl = `${API}/api`;
  const mIdQuery = maquina_id ? `&maquina_id=${maquina_id}` : '';

  const [mParadas, mProduccion, dProduccion, info, velocity] = await Promise.all([
    fetch(`${baseUrl}/paradas/summary-month?mes=${month}${mIdQuery}`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/produccion/summary-month?mes=${month}${mIdQuery}`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/produccion/summary-today?fecha=${today}${mIdQuery}`, { headers }).then(r => r.json()),
    fetch(`${baseUrl}/informacion`, { headers }).then(r => r.json()),
    maquina_id 
      ? fetch(`${baseUrl}/velocidad/series?maquina_id=${maquina_id}`, { headers }).then(r => r.json())
      : Promise.resolve({ success: true, data: [] })
  ]);

  return {
    monthly: {
      paradas:   mParadas.success   ? mParadas.data   : [],
      produccion: mProduccion.success ? mProduccion.data : [],
    },
    daily: {
      produccion: dProduccion.success ? dProduccion.data : [],
    },
    info: info.success ? info.data : [],
    velocity: velocity.success ? velocity.data : []
  };
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('curex_token'));
  const [slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const queryClient = useQueryClient();
  const { lastEvent, tvConfig } = useSocket();

  // Filtrar slides dinámicamente según la configuración recibida por Sockets
  const filteredSlides = SLIDES.filter(s => {
    // Si es el slide de enfoque, solo mostrarlo si hay una máquina asignada
    if (s.id === 'focus') return !!tvConfig?.maquina_id;
    return true;
  }).map(s => {
    // Si es el slide de enfoque, inyectar el nombre de la máquina dinámicamente
    if (s.id === 'focus') {
      return { ...s, props: { maquina: tvConfig.maquina_nombre } };
    }
    return s;
  });

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', tvConfig?.maquina_id],
    queryFn: () => {
      console.log(`[Dashboard] Fetching data for machine: ${tvConfig?.maquina_id || 'Global'}`);
      return fetchDashboard(tvConfig?.maquina_id);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      console.log('[Dashboard] Data loaded:', data);
    }
  }, [data]);

  /* Invalidar caché cuando llega evento WS */
  useEffect(() => {
    if (lastEvent) queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [lastEvent, queryClient]);

  /* Auto-avance de slides */
  const advance = useCallback(() => {
    setDirection(1);
    setSlideIdx(i => (i + 1) % filteredSlides.length);
  }, [filteredSlides.length]);

  useEffect(() => {
    const id = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [advance]);

  const goTo = (idx) => {
    setDirection(idx > slideIdx ? 1 : -1);
    setSlideIdx(idx);
  };

  const { id, Component, props: extraProps = {} } = filteredSlides[slideIdx] || filteredSlides[0];

  const handleLogout = () => {
    localStorage.removeItem('curex_token');
    localStorage.removeItem('curex_user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div 
      className={theme === 'light' ? 'light-theme' : ''}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--col-bg)' }}
    >
      <TopBar slides={filteredSlides} current={slideIdx} onSelect={goTo} theme={theme} toggleTheme={toggleTheme} />

      <main
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        aria-live="polite"
        aria-label="Panel de monitoreo industrial"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, padding: '20px 24px 16px' }}
          >
            <Component 
              data={id === 'productos' ? data?.daily : id === 'info' ? data?.info : data?.monthly} 
              velocity={data?.velocity}
              isLoading={isLoading} 
              isMonthly={id !== 'productos' && id !== 'info'}
              {...extraProps} 
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Slide progress bar */}
      <SlideProgress count={filteredSlides.length} current={slideIdx} duration={SLIDE_DURATION} />

      {/* Technical Footer Bar */}
      <footer style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 24px', 
        borderTop: '1px solid var(--col-border)',
        fontSize: '10px',
        color: 'var(--col-text-muted)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em'
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <span><span style={{ color: 'var(--col-brand)' }}>●</span> UNIT: {tvConfig?.maquina_nombre || 'CUREX-SYS-01'}</span>
          <span>UID: {localStorage.getItem('tv_uid')?.substring(0, 8)}</span>
          <span>LOCATION: {tvConfig?.maquina_nombre ? `LINEA ${tvConfig.maquina_nombre}` : 'PLANTA GENERAL'}</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>VITE BRIDGE</span>
          <span>ENGINE: REACT V.18</span>
          <span style={{ color: 'var(--col-text-secondary)' }}>PLATFORM STATUS: <span style={{ color: 'var(--col-success)' }}>NOMINAL</span></span>
        </div>
      </footer>
    </div>
  );
}

function SlideProgress({ count, current, duration }) {
  return (
    <div
      role="tablist"
      aria-label="Diapositivas"
      style={{ display: 'flex', gap: 6, padding: '8px 24px 12px', zIndex: 'var(--z-nav)' }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i < current
              ? 'var(--col-brand)'
              : i === current
                ? 'transparent'
                : 'var(--col-border-lg)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {i === current && (
            <motion.div
              key={`${current}-progress`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 0,
                background: 'var(--col-brand)',
                transformOrigin: 'left',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
