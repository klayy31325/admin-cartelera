import React from 'react';
import { Gauge } from 'lucide-react';

const TARGETS = {
  novoflex: 75,
  olympia: 88,
};

const ARC_RED = '#ef4444';
const ARC_ORANGE = '#f97316';
const ARC_GREEN = '#10b981';

export default function SlideVelocity({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_velocidad ?? [];
  const breakdown = maquina_id
    ? allBreakdown.filter((m) => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  const globalStats = maquina_id && breakdown.length > 0
    ? { promedio_real: breakdown[0].avg_real }
    : data?.velocidad ?? { promedio_real: 0 };

  const val = Number(globalStats.promedio_real) || 0;
  const maxSpeed = 100;

  const clampedVal = Math.min(Math.max(val, 0), maxSpeed);
  const angle = -90 + (clampedVal / maxSpeed) * 180;

  const isNovoflex = maquina?.toLowerCase().includes('novoflex');
  const isOlympia = maquina?.toLowerCase().includes('olympia');
  const currentTarget = isNovoflex ? TARGETS.novoflex : isOlympia ? TARGETS.olympia : 80;

  // Divisiones de colores más equilibradas según el objetivo
  let stop1, stop2;
  if (isNovoflex) {
    stop1 = 40; // 0-40: Rojo
    stop2 = 65; // 40-65: Naranja, 65-100: Verde (el objetivo es 75)
  } else if (isOlympia) {
    stop1 = 50; // 0-50: Rojo
    stop2 = 78; // 50-78: Naranja, 78-100: Verde (el objetivo es 88)
  } else {
    stop1 = 45; // 0-45: Rojo
    stop2 = 72; // 45-72: Naranja, 72-100: Verde (el objetivo es 80)
  }

  return (
    <section
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}>
        {maquina_id && (
          <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--col-surface-md)',
            borderRadius: 24,
            padding: '24px 32px',
            boxShadow: 'var(--shadow-glass)',
            border: '1px solid var(--col-border-lg)',
            overflow: 'hidden',
          }}>
            {/* Header del Monitor */}
            <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--col-brand-dim)',
                border: '1px solid var(--col-brand-glow)',
              }}>
                <Gauge size={22} strokeWidth={2.5} color="var(--col-brand)" />
              </div>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                  MONITOR DE RENDIMIENTO
                </p>
                <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--col-text-primary)', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Velocidad Real
                </h2>
              </div>
            </header>

            {/* Diseño en 2 columnas para TV */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '40px',
              alignItems: 'center',
              minHeight: 0,
            }}>
              {/* Columna Izquierda: Gauge SVG e indicación de velocidad actual */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
              }}>
                <svg viewBox="0 0 200 120" style={{ width: '100%', maxHeight: '200px', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={ARC_RED} />
                      <stop offset={`${stop1 - 2}%`} stopColor={ARC_RED} />
                      <stop offset={`${stop1 + 2}%`} stopColor={ARC_ORANGE} />
                      <stop offset={`${stop2 - 2}%`} stopColor={ARC_ORANGE} />
                      <stop offset={`${stop2 + 2}%`} stopColor={ARC_GREEN} />
                      <stop offset="100%" stopColor={ARC_GREEN} />
                    </linearGradient>
                    <filter id="needleGlow">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Arco del fondo (track) */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--col-gauge-track)" strokeWidth="12" strokeLinecap="round" />

                  {/* Arco activo con gradiente de color */}
                  {(() => {
                    const ARC_LENGTH = 80 * Math.PI;
                    const activeLen = ARC_LENGTH * (clampedVal / maxSpeed);
                    return (
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${activeLen} ${ARC_LENGTH}`}
                        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      />
                    );
                  })()}

                  {/* Aguja indicadora */}
                  <g style={{ transform: `translate(100px, 100px) rotate(${angle}deg)`, transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <polygon points="-2.5,-6 -1.5,-75 1.5,-75 2.5,-6" fill="var(--col-brand)" filter="url(#needleGlow)" />
                    <circle cx="0" cy="0" r="5" fill="var(--col-brand)" />
                    <circle cx="0" cy="0" r="2" fill="var(--col-surface-md)" />
                  </g>

                  {/* Ticks y leyendas */}
                  <text x="20" y="118" fill="var(--col-text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="800">0</text>
                  <text x="100" y="12" fill="var(--col-text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="800">50</text>
                  <text x="180" y="118" fill="var(--col-text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="800">{maxSpeed}</text>
                </svg>

                {/* Valor numérico principal (color dinámico según tema) */}
                <div style={{ marginTop: '-24px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                  <span className="stat-number" style={{ fontSize: '56px', fontWeight: 900, color: 'var(--col-text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {val.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--col-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>m/min</span>
                </div>
              </div>

              {/* Columna Derecha: Tarjetas de información */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', justifyContent: 'center' }}>
                {/* Identificación de la Máquina */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    MÁQUINA / LÍNEA
                  </span>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--col-text-primary)', margin: 0, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
                    {maquina}
                  </h2>
                </div>

                {/* Velocidad Objetivo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    VELOCIDAD OBJETIVO
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span className="stat-number" style={{ fontSize: '36px', fontWeight: 900, color: 'var(--col-text-primary)', lineHeight: 1 }}>
                      {currentTarget.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--col-text-muted)' }}>m/min</span>
                  </div>
                </div>

                {/* Desempeño */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    DESEMPEÑO GENERAL
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {(() => {
                      const speedPercentage = currentTarget > 0 ? (val / currentTarget) * 100 : 0;
                      let badgeBg = 'rgba(239, 68, 68, 0.15)';
                      let badgeColor = '#ef4444';
                      let badgeBorder = '1px solid rgba(239, 68, 68, 0.3)';
                      let badgeText = 'BAJO OBJETIVO';

                      if (speedPercentage >= 95) {
                        badgeBg = 'rgba(16, 185, 129, 0.15)';
                        badgeColor = '#10b981';
                        badgeBorder = '1px solid rgba(16, 185, 129, 0.3)';
                        badgeText = 'SISTEMA EFICIENTE';
                      } else if (speedPercentage >= 75) {
                        badgeBg = 'rgba(249, 115, 22, 0.15)';
                        badgeColor = '#f97316';
                        badgeBorder = '1px solid rgba(249, 115, 22, 0.3)';
                        badgeText = 'NIVEL ACEPTABLE';
                      }

                      return (
                        <>
                          <div style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '0.06em',
                            background: badgeBg,
                            color: badgeColor,
                            border: badgeBorder,
                            textTransform: 'uppercase',
                          }}>
                            {badgeText}
                          </div>
                          <span className="stat-number" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--col-text-primary)' }}>
                            {speedPercentage.toFixed(0)}%
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
