import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

import SlideGeneralDashboard from './slides/SlideGeneralDashboard';
import SlideMachineFocus from './slides/SlideMachineFocus';
import SlideTopProducts from './slides/SlideTopProducts';
import SlideInfo from './slides/SlideInfo';
import SlideVelocity from './slides/SlideVelocity';
import SlideWaste from './slides/SlideWaste';
import TopBar from './TopBar';
import Login from './Login';

const SLIDE_DURATION = 50_000; // 50 segundos

const SLIDES = [
  { id: 'general', label: 'Vista General', Component: SlideGeneralDashboard },
  { id: 'focus', label: 'Enfoque Máquina', Component: SlideMachineFocus },
  { id: 'info', label: 'Información', Component: SlideInfo },
  { id: 'productos', label: 'Top Productos', Component: SlideTopProducts },
];

/* Framer-motion variants — horizontal slide with spatial continuity */
const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchDashboard(maquina_id = null) {
  const baseUrl = `${API}/api/public`;
  const mIdQuery = maquina_id ? `?maquina_id=${maquina_id}` : '';

  const res = await fetch(`${baseUrl}/dashboard${mIdQuery}`);
  const json = await res.json();

  if (!json.success) throw new Error(json.message || 'Error fetching dashboard');

  // Fetch info separately as it might be in a different public route
  const infoRes = await fetch(`${baseUrl}/informacion`);
  const infoJson = await infoRes.json();

  return {
    ...json.data,
    info: infoJson.success ? infoJson.data : []
  };
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('curex_token'));
  const [slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const queryClient = useQueryClient();
  const { lastEvent, tvConfig: socketConfig } = useSocket();

  // Resolver configuración: Prioridad URL > Socket
  const tvConfig = (() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('maquina_id');
    const urlNombre = params.get('maquina_nombre');
    
    if (urlId) {
      return { maquina_id: Number(urlId), maquina_nombre: urlNombre || `MÁQUINA ${urlId}` };
    }
    return socketConfig;
  })();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', tvConfig?.maquina_id],
    queryFn: () => fetchDashboard(tvConfig?.maquina_id),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Generar slides dinámicamente
  const filteredSlides = (() => {
    const base = [
      {
        id: 'general',
        label: 'Vista General',
        Component: SlideGeneralDashboard,
        props: { maquina: tvConfig?.maquina_nombre, maquina_id: tvConfig?.maquina_id }
      }
    ];

    if (tvConfig?.maquina_id) {
      // Caso 1: TV tiene una máquina asignada (o forzada por URL)
      const commonProps = { maquina: tvConfig.maquina_nombre, maquina_id: tvConfig.maquina_id };
      base.push({
        id: 'focus',
        label: `Enfoque ${tvConfig.maquina_nombre}`,
        Component: SlideMachineFocus,
        props: commonProps
      });
      base.push({ id: 'velocidad', label: 'Velocidad Unitaria', Component: SlideVelocity, props: commonProps });
      base.push({ id: 'desperdicio', label: 'Desperdicio Unitario', Component: SlideWaste, props: commonProps });
    } else if (data?.machines?.length > 0) {
      // Caso 2: TV genérica, rotar por todas las máquinas encontradas en la data
      data.machines.forEach(m => {
        const mProps = { maquina: m.nombre, maquina_id: m.id };
        base.push({
          id: `focus-${m.id}`,
          label: `Enfoque ${m.nombre}`,
          Component: SlideMachineFocus,
          props: mProps
        });
        base.push({ id: `vel-${m.id}`, label: `Velocidad ${m.nombre}`, Component: SlideVelocity, props: mProps });
        base.push({ id: `desp-${m.id}`, label: `Desperdicio ${m.nombre}`, Component: SlideWaste, props: mProps });
      });
      
      // Análisis globales solo en modo genérico
      base.push({ id: 'velocidad-global', label: 'Rendimiento Global', Component: SlideVelocity });
      base.push({ id: 'desperdicio-global', label: 'Desperdicio Global', Component: SlideWaste });
    }

    base.push({ id: 'info', label: 'Información', Component: SlideInfo });
    base.push({ id: 'productos', label: 'Top Productos', Component: SlideTopProducts });

    return base;
  })();

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
            {Component ? (
              <Component
                data={
                  id === 'productos' || id.startsWith('focus') || id === 'velocidad' || id === 'desperdicio' ? data?.daily :
                    id === 'info' ? data?.info :
                      data?.monthly
                }
                velocity={
                  id.startsWith('focus') || id === 'velocidad' ? data?.daily?.velocidad?.series :
                    id === 'general' ? data?.monthly?.velocidad :
                      null
                }
                isLoading={isLoading}
                isMonthly={!(id === 'productos' || id === 'info' || id.startsWith('focus') || id === 'velocidad' || id === 'desperdicio')}
                {...extraProps}
              />
            ) : (
              <div style={{ color: 'white', padding: 40 }}>Error: Component not found for slide {id}</div>
            )}
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
