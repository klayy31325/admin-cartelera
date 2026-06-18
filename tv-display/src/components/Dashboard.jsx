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
import SlidePendingConfiguration from './slides/SlidePendingConfiguration';
import TopBar from './TopBar';
import ConnectionBadge from './ConnectionBadge';
import Login from './Login';

const SLIDE_DURATION = 60_000; // 1 minuto

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

  // Smart TV Focus States
  const [focusZone, setFocusZone] = useState('topbar-nav'); // 'topbar-nav' | 'topbar-actions' | 'slide-content'
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showFocusVisual, setShowFocusVisual] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProductionInteracting, setIsProductionInteracting] = useState(false);
  const interactionTimeoutRef = React.useRef(null);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Sincronizar clase de tema con el elemento body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }, [theme]);

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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', tvConfig?.maquina_id],
    queryFn: () => fetchDashboard(tvConfig?.maquina_id),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Generar slides dinámicamente
  const filteredSlides = (() => {
    // Si la pantalla no tiene una máquina configurada, mostrar únicamente el panel de espera premium
    if (!tvConfig?.maquina_id) {
      return [
        {
          id: 'pending-config',
          label: 'VINCULACIÓN REQUERIDA',
          Component: SlidePendingConfiguration,
          props: {}
        }
      ];
    }

    const base = [
      {
        id: 'general',
        label: 'VISTA GENERAL',
        Component: SlideGeneralDashboard,
        props: { maquina: tvConfig?.maquina_nombre, maquina_id: tvConfig?.maquina_id }
      }
    ];

    // Caso 1: TV tiene una máquina asignada (o forzada por URL)
    const commonProps = { maquina: tvConfig.maquina_nombre, maquina_id: tvConfig.maquina_id };
    base.push({ id: 'velocidad', label: 'VELOCIDAD UNITARIA', Component: SlideVelocity, props: commonProps });
    base.push({ id: 'produccion-info', label: 'PRODUCCIÓN DIARIA', Component: SlideProductionInfo, props: commonProps });
    base.push({ id: 'info', label: 'INFORMACIÓN', Component: SlideInfo });

    return base;
  })();

  /* Invalidar caché y forzar refetch inmediato cuando llega evento WS con pequeño delay preventivo */
  useEffect(() => {
    if (lastEvent) {
      console.log('[Dashboard] Evento real-time recibido:', lastEvent.type);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const timer = setTimeout(() => {
        refetch();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [lastEvent, queryClient, refetch]);

  /* Solicitar pantalla completa automáticamente al primer clic o toque */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requestFs = () => {
      const doc = document.documentElement;
      if (!document.fullscreenElement && doc.requestFullscreen) {
        doc.requestFullscreen().catch((err) => {
          console.log(`[Fullscreen] Auto-inicio omitido: ${err.message}`);
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

  const handleProductionInteraction = useCallback(() => {
    const currentId = filteredSlides[slideIdx]?.id;
    if (!currentId?.startsWith('prod-info') && !currentId?.startsWith('produccion-info')) return;

    setIsProductionInteracting(true);

    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    interactionTimeoutRef.current = setTimeout(() => {
      setIsProductionInteracting(false);
    }, 10_000);
  }, [slideIdx, filteredSlides]);

  // Resetear interacción al cambiar de slide
  useEffect(() => {
    setIsProductionInteracting(false);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
  }, [slideIdx]);

  /* Auto-avance de slides */
  const advance = useCallback(() => {
    setDirection(1);
    setSlideIdx(i => {
      const next = (i + 1) % filteredSlides.length;
      if (focusZone === 'topbar-nav') {
        setFocusedIndex(next);
      }
      return next;
    });
  }, [filteredSlides.length, focusZone]);

  const currentSlide = filteredSlides[slideIdx];
  const activeDuration = currentSlide?.id === 'velocidad' || currentSlide?.id === 'velocidad-global' || currentSlide?.id?.startsWith('vel-') ? 15_000 : SLIDE_DURATION;
  const isTimerPaused = isPaused || (isProductionInteracting && (currentSlide?.id?.startsWith('prod-info') || currentSlide?.id?.startsWith('produccion-info')));

  // Rotador inteligente con soporte de pausa y duración dinámica
  useEffect(() => {
    if (isTimerPaused) return;

    const timer = setTimeout(() => {
      // Ocultar foco al avanzar de forma automática
      setShowFocusVisual(false);
      advance();
    }, activeDuration);

    return () => clearTimeout(timer);
  }, [slideIdx, isTimerPaused, advance, activeDuration]);

  const goTo = (idx) => {
    setDirection(idx > slideIdx ? 1 : -1);
    setSlideIdx(idx);
  };

  /* Focus Manager y Control Remoto */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Omitir si hay campos de texto enfocados
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Atajos físicos del mando (Color Keys y Teclado)
      const isRed = e.keyCode === 403 || e.key === 'r' || e.key === 'R';
      const isGreen = e.keyCode === 404 || e.key === 'g' || e.key === 'G';
      const isYellow = e.keyCode === 405 || e.key === 'y' || e.key === 'Y';
      const isBlue = e.keyCode === 406 || e.key === 'b' || e.key === 'B';

      // Atajo numérico (1-9) para saltar directo a slides
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (idx < filteredSlides.length) {
          e.preventDefault();
          goTo(idx);
          setFocusZone('topbar-nav');
          setFocusedIndex(idx);
          setShowFocusVisual(true);
          return;
        }
      }

      if (isRed) {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (isGreen) {
        e.preventDefault();
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        return;
      }
      if (isYellow) {
        e.preventDefault();
        setIsPaused(p => !p);
        return;
      }
      if (isBlue) {
        e.preventDefault();
        const doc = document.documentElement;
        if (!document.fullscreenElement) {
          doc.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen().catch(err => console.log(err));
        }
        return;
      }

      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) ||
        [38, 40, 37, 39].includes(e.keyCode);

      // Activar la visualización del foco en la primera interacción de D-Pad
      if (isArrow && !showFocusVisual) {
        setShowFocusVisual(true);
        setFocusZone('topbar-nav');
        setFocusedIndex(slideIdx);
        e.preventDefault();
        return;
      }

      const isUp = e.key === 'ArrowUp' || e.keyCode === 38;
      const isDown = e.key === 'ArrowDown' || e.keyCode === 40;
      const isLeft = e.key === 'ArrowLeft' || e.keyCode === 37;
      const isRight = e.key === 'ArrowRight' || e.keyCode === 39;
      const isEnter = e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32;

      // Determinar si la diapositiva actual es interactiva
      const currentSlide = filteredSlides[slideIdx];
      const isSlideInteractive = currentSlide?.Component === SlideProductionInfo;
      const isProdInteractionKey = isArrow || isEnter;

      if (isSlideInteractive && isProdInteractionKey) {
        handleProductionInteraction();
      }

      if (focusZone === 'topbar-nav') {
        if (isLeft) {
          e.preventDefault();
          const nextIdx = (focusedIndex - 1 + filteredSlides.length) % filteredSlides.length;
          setFocusedIndex(nextIdx);
          goTo(nextIdx);
        } else if (isRight) {
          e.preventDefault();
          if (focusedIndex === filteredSlides.length - 1) {
            setFocusZone('topbar-actions');
            setFocusedIndex(0);
          } else {
            const nextIdx = (focusedIndex + 1) % filteredSlides.length;
            setFocusedIndex(nextIdx);
            goTo(nextIdx);
          }
        } else if (isDown) {
          e.preventDefault();
          if (isSlideInteractive) {
            setFocusZone('slide-content');
          }
        }
      } else if (focusZone === 'topbar-actions') {
        const actionsCount = 3; // Install PWA, Fullscreen, Theme
        if (isLeft) {
          e.preventDefault();
          if (focusedIndex === 0) {
            setFocusZone('topbar-nav');
            setFocusedIndex(filteredSlides.length - 1);
          } else {
            setFocusedIndex(focusedIndex - 1);
          }
        } else if (isRight) {
          e.preventDefault();
          if (focusedIndex < actionsCount - 1) {
            setFocusedIndex(focusedIndex + 1);
          }
        } else if (isDown) {
          e.preventDefault();
          if (isSlideInteractive) {
            setFocusZone('slide-content');
          }
        } else if (isEnter) {
          e.preventDefault();
          if (focusedIndex === 0) {
            const installBtn = document.querySelector('[title*="Instalar"]');
            if (installBtn) installBtn.click();
          } else if (focusedIndex === 1) {
            const fsBtn = document.querySelector('[title*="completa"]');
            if (fsBtn) fsBtn.click();
          } else if (focusedIndex === 2) {
            toggleTheme();
          }
        }
      } else if (focusZone === 'slide-content') {
        // En slide-content, delegamos navegación vertical y Enter al slide.
        // Pero la navegación horizontal (izquierda/derecha) cambia slides globalmente.
        if (isLeft) {
          e.preventDefault();
          const nextIdx = (slideIdx - 1 + filteredSlides.length) % filteredSlides.length;
          goTo(nextIdx);
          setFocusZone('topbar-nav');
          setFocusedIndex(nextIdx);
        } else if (isRight) {
          e.preventDefault();
          const nextIdx = (slideIdx + 1) % filteredSlides.length;
          goTo(nextIdx);
          setFocusZone('topbar-nav');
          setFocusedIndex(nextIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSlides, slideIdx, focusedIndex, focusZone, showFocusVisual, isPaused, advance, handleProductionInteraction]);

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
    <div className={`tv-shell${theme === 'light' ? ' light-theme' : ''}`}>
      <TopBar
        slides={filteredSlides}
        current={slideIdx}
        onSelect={goTo}
        theme={theme}
        toggleTheme={toggleTheme}
        maquina={tvConfig?.maquina_nombre}
        focusZone={focusZone}
        focusedIndex={focusedIndex}
        showFocusVisual={showFocusVisual}
      />

      <main
        className="tv-shell__main"
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
            className="tv-slide"
            onMouseMove={id.startsWith('prod-info') || id.startsWith('produccion-info') ? handleProductionInteraction : undefined}
            onClick={id.startsWith('prod-info') || id.startsWith('produccion-info') ? handleProductionInteraction : undefined}
            onTouchStart={id.startsWith('prod-info') || id.startsWith('produccion-info') ? handleProductionInteraction : undefined}
            onKeyDown={id.startsWith('prod-info') || id.startsWith('produccion-info') ? handleProductionInteraction : undefined}
          >
            {Component ? (
              <Component
                data={
                  id === 'productos' ? data?.daily :
                    id === 'info' ? data?.info :
                      id.startsWith('prod-info') || id.startsWith('produccion-info') ? data?.produccion_info :
                        id === 'general' ? { ...data?.monthly, resumen_excel: data?.resumen_excel, metas_parada: data?.metas_parada } :
                          data?.monthly
                }
                velocity={
                  id.startsWith('vel') ? data?.daily?.velocidad?.series :
                    id === 'general' ? data?.monthly?.velocidad :
                      null
                }
                isLoading={isLoading}
                isMonthly={id === 'general' ? true : !(id === 'productos' || id === 'info' || id.startsWith('vel') || id.startsWith('desp'))}
                isFocused={showFocusVisual && focusZone === 'slide-content'}
                onExitFocus={(dir) => {
                  if (dir === 'up') {
                    setFocusZone('topbar-nav');
                    setFocusedIndex(slideIdx);
                  }
                }}
                {...extraProps}
              />
            ) : (
              <div style={{ color: 'white', padding: 40 }}>Error: Component not found for slide {id}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Slide progress bar */}
      <SlideProgress count={filteredSlides.length} current={slideIdx} duration={activeDuration} isPaused={isTimerPaused} />

      {/* Technical Footer Bar */}
      <footer className="tv-footer">
        <div className="tv-footer__meta">
          <span><span style={{ color: 'var(--col-brand)' }}>●</span> MAQUINA: {tvConfig?.maquina_nombre || 'CUREX-SYS-01'}</span>
          <span>UID: {localStorage.getItem('tv_uid')?.substring(0, 8)}</span>
          <span>LOCATION: {tvConfig?.maquina_nombre ? `LINEA ${tvConfig.maquina_nombre}` : 'PLANTA GENERAL'}</span>
        </div>
        <div className="tv-footer__actions">
          {isPaused && (
            <span style={{
              background: 'var(--col-brand-dim)',
              color: 'var(--col-brand)',
              border: '1px solid var(--col-brand-glow)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--col-brand)',
                animation: 'pulse 1.5s infinite ease-in-out'
              }} />
              AUTOROTATE: PAUSED
            </span>
          )}
          <ConnectionBadge />
        </div>
      </footer>
    </div>
  );
}

function SlideProgress({ count, current, duration, isPaused }) {
  return (
    <div
      role="tablist"
      aria-label="Diapositivas"
      className="tv-progress"
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
              key={`${current}-progress-${isPaused ? 'paused' : 'active'}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isPaused ? 0 : 1 }}
              transition={{ duration: isPaused ? 0 : duration / 1000, ease: 'linear' }}
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
