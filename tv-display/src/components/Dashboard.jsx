import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config/api-config';

import SlideGeneralDashboard from './slides/SlideGeneralDashboard';
import SlideTopProducts from './slides/SlideTopProducts';
import SlideInfo from './slides/SlideInfo';
import SlideVelocity from './slides/SlideVelocity';
import SlideWaste from './slides/SlideWaste';
import SlideProductionInfo from './slides/SlideProductionInfo';
import TopBar from './TopBar';
import ConnectionBadge from './ConnectionBadge';
import Login from './Login';

const SLIDE_DURATION = 50_000; // 50 segundos

/* Framer-motion variants — GPU-optimized dynamic fade transition for low-power TV displays */
const variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const API = API_BASE_URL;

const isSmartTv = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('smarttv') ||
    ua.includes('tizen') ||
    ua.includes('web0s') ||
    ua.includes('webos') ||
    ua.includes('googletv') ||
    ua.includes('androidtv') ||
    ua.includes('appletv') ||
    ua.includes('operatv') ||
    ua.includes('philipstv') ||
    ua.includes('sonydtv') ||
    ua.includes('smart-tv') ||
    ua.includes('kodi') ||
    ua.includes('viera') ||
    ua.includes('roku')
  );
};

const getFocusableElements = () => {
  if (typeof document === 'undefined') return [];
  return Array.from(
    document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  });
};

async function fetchDashboard(maquina_id = null) {
  const baseUrl = `${API}/api/public`;
  const mIdQuery = (maquina_id !== null && maquina_id !== undefined) ? `?maquina_id=${maquina_id}` : '';

  const res = await fetch(`${baseUrl}/dashboard${mIdQuery}`);
  const json = await res.json();

  if (!json.success) throw new Error(json.message || 'Error fetching dashboard');

  // Fetch info separately
  const [infoRes, prodInfoRes] = await Promise.all([
    fetch(`${baseUrl}/informacion`),
    fetch(`${baseUrl}/produccion-informativa${mIdQuery}`)
  ]);

  const infoJson = await infoRes.json();
  const prodInfoJson = await prodInfoRes.json();

  return {
    ...json.data,
    info: infoJson.success ? infoJson.data : [],
    produccion_info: prodInfoJson.success ? prodInfoJson.data : []
  };
}

export default function Dashboard() {
  // Detectar si es una TV o tiene bypass explícito en la URL para omitir el login
  const isTvBypass = (() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('tv') === 'true' ||
      params.get('bypass') === 'true' ||
      !!params.get('maquina_id') ||
      isSmartTv()
    );
  })();

  const [isAuthenticated, setIsAuthenticated] = useState(isTvBypass || !!localStorage.getItem('curex_token'));
  const [slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [theme, setTheme] = useState('light');
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
      base.push({ id: 'velocidad', label: 'Velocidad Unitaria', Component: SlideVelocity, props: commonProps });
      base.push({ id: 'produccion-info', label: 'Producción Diaria', Component: SlideProductionInfo, props: commonProps });
    } else if (data?.machines?.length > 0) {
      // Caso 2: TV genérica, rotar por todas las máquinas encontradas en la data
      data.machines.forEach(m => {
        const mProps = { maquina: m.nombre, maquina_id: m.id };
        base.push({ id: `vel-${m.id}`, label: `Velocidad ${m.nombre}`, Component: SlideVelocity, props: mProps });
        base.push({ id: `desp-${m.id}`, label: `Desperdicio ${m.nombre}`, Component: SlideWaste, props: mProps });
        base.push({
          id: `prod-info-${m.id}`,
          label: `Metas ${m.nombre}`,
          Component: SlideProductionInfo,
          props: mProps
        });
      });

      // Análisis globales solo en modo genérico
      base.push({ id: 'velocidad-global', label: 'Rendimiento Global', Component: SlideVelocity });
      base.push({ id: 'desperdicio-global', label: 'Desperdicio Global', Component: SlideWaste });
    }

    base.push({ id: 'info', label: 'Información', Component: SlideInfo });

    // Solo mostrar paneles globales/de planta si es una TV genérica sin máquina asignada
    if (!tvConfig?.maquina_id) {
      base.push({ id: 'produccion-info-global', label: 'Producción Diaria', Component: SlideProductionInfo });
      base.push({ id: 'productos', label: 'Top Productos', Component: SlideTopProducts });
    }

    return base;
  })();

  /* Invalidar caché cuando llega evento WS */
  useEffect(() => {
    if (lastEvent) queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [lastEvent, queryClient]);

  // El modo TV fue removido para garantizar el renderizado responsive nativo sin zoom forzado

  /* Solicitar pantalla completa automáticamente al primer clic o toque (evita el bloqueo de seguridad inicial del navegador) */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestFs = () => {
      const doc = document.documentElement;
      if (!document.fullscreenElement && doc.requestFullscreen) {
        doc.requestFullscreen().catch((err) => {
          console.log(`[Fullscreen] Auto-inicio omitido/bloqueado por políticas del navegador: ${err.message}`);
        });
      }
      document.removeEventListener('click', requestFs);
      document.removeEventListener('touchstart', requestFs);
    };

    document.addEventListener('click', requestFs);
    document.addEventListener('touchstart', requestFs);

    return () => {
      document.removeEventListener('click', requestFs);
      document.removeEventListener('touchstart', requestFs);
    };
  }, []);

  /* Auto-avance de slides */
  const advance = useCallback(() => {
    setDirection(1);
    setSlideIdx(i => (i + 1) % filteredSlides.length);
  }, [filteredSlides.length]);

  useEffect(() => {
    const id = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [advance]);

  /* Control remoto / Teclado para navegar entre diapositivas de la cartelera */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Omitir si hay campos de texto enfocados
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        advance();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setDirection(-1);
        setSlideIdx(i => (i - 1 + filteredSlides.length) % filteredSlides.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advance, filteredSlides.length]);

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

  /*  if (!isAuthenticated) {
     return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
   } */

  return (
    <div
      className={theme === 'light' ? 'light-theme' : ''}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--col-bg)' }}
    >
      <TopBar
        slides={filteredSlides}
        current={slideIdx}
        onSelect={goTo}
        theme={theme}
        toggleTheme={toggleTheme}
        maquina={tvConfig?.maquina_nombre}
      />

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
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              padding: '20px 24px 16px',
            }}
          >
            {Component ? (
              <Component
                data={
                  id === 'productos' ? data?.daily :
                    id === 'info' ? data?.info :
                      id.startsWith('prod-info') || id.startsWith('produccion-info') ? data?.produccion_info :
                        data?.monthly
                }
                velocity={
                  id.startsWith('vel') ? data?.daily?.velocidad?.series :
                    id === 'general' ? data?.monthly?.velocidad :
                      null
                }
                isLoading={isLoading}
                isMonthly={id === 'general' ? true : !(id === 'productos' || id === 'info' || id.startsWith('vel') || id.startsWith('desp'))}
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
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>

          <ConnectionBadge />
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
