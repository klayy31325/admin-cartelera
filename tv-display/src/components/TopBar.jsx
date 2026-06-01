import React, { useState, useEffect } from 'react';
import { Factory, Sun, Moon, Maximize, Minimize, Download } from 'lucide-react';

export default function TopBar({ slides, current, onSelect, theme, toggleTheme, maquina }) {
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
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        alignItems: 'center',
        padding: '32px 48px',
        background: 'transparent',
        zIndex: 'var(--z-nav)',
        flexShrink: 0,
        transition: 'all 0.4s ease'
      }}
    >
      {/* 1. BRAND (Left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="/logo-curex.png" 
          alt="Curex Logo" 
          style={{ 
            height: '100px', 
            objectFit: 'contain'
          }} 
        />

      </div>

      {/* 2. CENTER: MACHINE NAME + DISCRETE NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--col-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          margin: 0,
          lineHeight: 1
        }}>
          {maquina || 'Planta General'}
        </h2>

        <nav style={{ display: 'flex', gap: 24 }}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => onSelect(i)}
              style={{
                background: 'none',
                border: 'none',
                color: i === current ? 'var(--col-brand)' : 'var(--col-text-muted)',
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: i === current ? 1 : 0.4,
                padding: '4px 0',
                position: 'relative'
              }}
            >
              {slide.label}
              {i === current && (
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  width: '100%',
                  height: '1px',
                  background: 'var(--col-brand)',
                  borderRadius: '1px'
                }} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 3. CLOCK, FULLSCREEN & THEME (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 24 }}>
        <ClockDisplay />

        <button
          onClick={() => {
            if (deferredPrompt) {
              handleInstallClick();
            } else {
              alert("No se puede instalar desde aquí en este momento.\n\nPara instalar como PWA asegúrate de:\n1. Estar accediendo vía 'localhost' o HTTPS.\n2. Usar un navegador compatible (Chrome/Edge).\n3. Que la app no esté ya instalada.");
            }
          }}
          title="Instalar Cartelera como Aplicación (PWA)"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--col-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            padding: 0,
            opacity: deferredPrompt ? 0.8 : 0.4,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = deferredPrompt ? 0.8 : 0.4}
        >
          <Download size={14} />
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--col-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            padding: 0,
            opacity: 0.4,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>

        {/* El botón de Modo TV fue removido */}

        <button
          onClick={toggleTheme}
          title="Cambiar tema"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--col-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            padding: 0,
            opacity: 0.4,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

function ClockDisplay() {
  return (
    <p className="font-mono" style={{
      fontSize: '11px',
      color: 'var(--col-text-muted)',
      fontWeight: 600,
      margin: 0,
      whiteSpace: 'nowrap',
      opacity: 0.7,
      letterSpacing: '0.05em'
    }}>
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
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase();
  return `${date} | ${time}`;
}
