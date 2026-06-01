import React from 'react';
import { Sun, Moon, Maximize, Minimize, Download } from 'lucide-react';

export default function TopBar({ slides, current, onSelect, theme, toggleTheme, maquina, focusZone, focusedIndex, showFocusVisual }) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (typeof window === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`[Fullscreen] Error al activar: ${err.message}`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const iconBtnClass = (focused) =>
    `tv-topbar__icon-btn${focused ? '        tv-focused' : ''}`;

  return (
    <header className="tv-topbar">
      <div className="tv-topbar__brand">
        <img src="/logo-curex.png" alt="Curex" className="tv-topbar__logo" />
      </div>

      <div className="tv-topbar__center">
        <h2 className="tv-topbar__title" title={maquina || 'Planta General'}>
          {maquina || 'Planta General'}
        </h2>

        <nav className="tv-topbar__nav" aria-label="Secciones de la cartelera">
          {slides.map((slide, i) => {
            const isTabFocused = showFocusVisual && focusZone === 'topbar-nav' && focusedIndex === i;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => onSelect(i)}
                className={`tv-topbar__tab${i === current ? ' tv-topbar__tab--active' : ''}${isTabFocused ? ' tv-focused' : ''}`}
              >
                {slide.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="tv-topbar__actions">
        <ClockDisplay />

        <button
          type="button"
          onClick={() => {
            if (deferredPrompt) {
              handleInstallClick();
            } else {
              alert("No se puede instalar desde aquí en este momento.\n\nPara instalar como PWA asegúrate de:\n1. Estar accediendo vía 'localhost' o HTTPS.\n2. Usar un navegador compatible (Chrome/Edge).\n3. Que la app no esté ya instalada.");
            }
          }}
          title="Instalar Cartelera como Aplicación (PWA)"
          className={iconBtnClass(showFocusVisual && focusZone === 'topbar-actions' && focusedIndex === 0)}
          style={{ opacity: deferredPrompt ? 0.8 : 0.4 }}
        >
          <Download size={12} />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          className={iconBtnClass(showFocusVisual && focusZone === 'topbar-actions' && focusedIndex === 1)}
        >
          {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title="Cambiar tema"
          className={iconBtnClass(showFocusVisual && focusZone === 'topbar-actions' && focusedIndex === 2)}
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
        </button>
      </div>
    </header>
  );
}

function ClockDisplay() {
  return (
    <p
      className="font-mono"
      style={{
        fontSize: '9px',
        color: 'var(--col-text-muted)',
        fontWeight: 600,
        margin: 0,
        whiteSpace: 'nowrap',
        opacity: 0.7,
        letterSpacing: '0.05em',
      }}
    >
      <LiveClock />
    </p>
  );
}

function LiveClock() {
  const [timeStr, setTimeStr] = React.useState(getFullTime());
  React.useEffect(() => {
    const id = setInterval(() => setTimeStr(getFullTime()), 1000);
    return () => clearInterval(id);
  }, []);
  return timeStr;
}

function getFullTime() {
  const now = new Date();
  const date = now
    .toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    .toUpperCase()
    .replace(/\./g, '');
  const time = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${date} | ${time}`;
}
