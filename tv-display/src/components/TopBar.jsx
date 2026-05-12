import ConnectionBadge from './ConnectionBadge';
import { Factory, Sun, Moon } from 'lucide-react';

export default function TopBar({ slides, current, onSelect, theme, toggleTheme }) {
  const now = new Date();
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--col-border)',
        zIndex: 'var(--z-nav)',
        flexShrink: 0,
        gap: 16,
      }}
    >
      {/* Brand & Sync Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div>
          <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
            INDUSTRIAL MONITORING SYSTEM
          </p>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--col-brand)', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.05em' }}>
            CARTELERA DIGITAL V.2.5
          </h1>
        </div>
        <ConnectionBadge />
      </div>

      {/* Slide tabs */}
      <nav aria-label="Navegación de vistas" style={{ display: 'flex', gap: 8 }}>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            role="tab"
            aria-selected={i === current}
            onClick={() => onSelect(i)}
            style={{
              padding: '6px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: i === current ? 'var(--col-brand)' : 'rgba(255,255,255,0.1)',
              background: i === current ? 'var(--col-brand-dim)' : 'transparent',
              color: i === current ? 'var(--col-brand)' : 'var(--col-text-muted)',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {slide.label}
          </button>
        ))}
      </nav>

      {/* Right: clock + theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          style={{
            background: 'var(--col-surface-md)',
            border: '1px solid var(--col-border-lg)',
            borderRadius: 'var(--radius-sm)',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--col-brand)'
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            SERVER TIME
          </p>
          <ClockDisplay />
        </div>
      </div>
    </header>
  );
}

function ClockDisplay() {
  // Re-renders every second via CSS — avoids JS interval re-renders on parent
  return (
    <p
      className="font-mono stat-number"
      aria-label="Hora actual"
      style={{ fontSize: 'var(--text-lg)', color: 'var(--col-text-primary)', letterSpacing: '0.04em' }}
    >
      <LiveClock />
    </p>
  );
}

function LiveClock() {
  const [time, setTime] = React.useState(now());
  React.useEffect(() => {
    const id = setInterval(() => setTime(now()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function now() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Need React in scope for LiveClock
import React from 'react';
