import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Gauge } from 'lucide-react';

const TARGETS = {
  novoflex: 75,
  olympia: 88,
};

const NEEDLE_COLOR = '#f58300ff';
const ARC_RED = '#ef4444';
const ARC_ORANGE = '#f97316';
const ARC_YELLOW = '#22ea08ff';

export default function SlideVelocity({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_velocidad ?? [];
  const breakdown = maquina_id
    ? allBreakdown.filter((m) => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  const globalStats = maquina_id && breakdown.length > 0
    ? { promedio_real: breakdown[0].avg_real }
    : data?.velocidad ?? { promedio_real: 0 };

  const showChart = !maquina_id && breakdown.length > 0;
  const val = Number(globalStats.promedio_real) || 0;
  const maxSpeed = 100;

  const clampedVal = Math.min(Math.max(val, 0), maxSpeed);
  const angle = -90 + (clampedVal / maxSpeed) * 180;

  const isNovoflex = maquina?.toLowerCase().includes('novoflex');
  const isOlympia = maquina?.toLowerCase().includes('olympia');
  const currentTarget = isNovoflex ? TARGETS.novoflex : isOlympia ? TARGETS.olympia : null;

  let stop1, stop2;
  if (isNovoflex) {
    stop1 = (50 / maxSpeed) * 100;
    stop2 = (80 / maxSpeed) * 100;
  } else if (isOlympia) {
    stop1 = (40 / maxSpeed) * 100;
    stop2 = (70 / maxSpeed) * 100;
  } else {
    stop1 = 35;
    stop2 = 65;
  }

  const tickStyle = { fill: 'var(--col-text-muted)', fontSize: 10, fontWeight: 700 };

  return (
    <section
      className={showChart ? 'slide-velocity--split' : ''}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: maquina_id ? '12px 20px' : '24px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: maquina_id ? 32 : 0,
        width: '100%',
      }}>
        {maquina_id && currentTarget != null && (
          <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--col-surface-md)',
            borderRadius: 18,
            padding: '14px 20px 12px',
            boxShadow: '0 6px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid var(--col-border)',
            overflow: 'hidden',
          }}>
            <header style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 0 }}>
              <Gauge size={20} strokeWidth={2.5} color={NEEDLE_COLOR} />
              <h2 style={{ fontSize: 15, margin: 0, color: 'var(--col-text-primary)', fontWeight: 600 }}>
                Velocidad Real · {maquina}
              </h2>
            </header>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: -6 }}>
              <svg viewBox="0 0 200 50" style={{ width: '100%', maxHeight: '60%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={ARC_RED} />
                    <stop offset={`${stop1 - 1}%`} stopColor={ARC_RED} />
                    <stop offset={`${stop1 + 1}%`} stopColor={ARC_ORANGE} />
                    <stop offset={`${stop2 - 1}%`} stopColor={ARC_ORANGE} />
                    <stop offset={`${stop2 + 1}%`} stopColor={ARC_YELLOW} />
                    <stop offset="100%" stopColor={ARC_YELLOW} />
                  </linearGradient>
                  <filter id="needleGlow">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path d="M 55 47 A 45 45 0 0 1 145 47" fill="none" stroke="url(#gaugeGradient)" strokeWidth="10" strokeLinecap="round" opacity="0.18" />

                {(() => {
                  const ARC_LENGTH = 45 * Math.PI;
                  const activeLen = ARC_LENGTH * (clampedVal / maxSpeed);
                  return (
                    <path
                      d="M 55 47 A 45 45 0 0 1 145 47"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${activeLen} ${ARC_LENGTH}`}
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    />
                  );
                })()}

                <g style={{ transform: `translate(100px, 47px) rotate(${angle}deg)`, transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                  <polygon points="-1.5,-3 -1,-37 1,-37 1.5,-3" fill={NEEDLE_COLOR} filter="url(#needleGlow)" />
                  <circle cx="0" cy="0" r="4" fill={NEEDLE_COLOR} />
                  <circle cx="0" cy="0" r="1.5" fill="var(--col-surface-md)" />
                </g>

                <text x="55" y="49" fill="var(--col-text-muted)" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">0</text>
                <text x="145" y="49" fill="var(--col-text-muted)" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{maxSpeed}</text>
              </svg>

              <div style={{ marginTop: -12, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span className="stat-number" style={{ fontSize: 40, color: NEEDLE_COLOR, lineHeight: 1, fontWeight: 800 }}>
                    {val.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--col-text-muted)', fontWeight: 700 }}>m/min</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--col-border)', opacity: 0.5 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Objetivo
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: NEEDLE_COLOR, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {currentTarget}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--col-text-muted)' }}>m/min</span>
              </div>
            </div>
          </div>
        )}

        {!maquina_id && !showChart && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
              <span style={{ color: NEEDLE_COLOR, fontSize: 64, fontWeight: 900 }}>{val.toFixed(1)}</span>
              <span style={{ color: 'var(--col-text-muted)', fontSize: 24, fontWeight: 600 }}>m/min</span>
            </div>
            <p style={{ color: 'var(--col-text-muted)', textAlign: 'center', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>
              Velocidad Promedio
            </p>
          </div>
        )}

        {showChart && (
          <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
            <h3 style={{ color: 'var(--col-text-primary)', fontSize: 16, marginBottom: 12, opacity: 0.8 }}>
              Desglose por línea
            </h3>
            <div style={{ height: 'calc(100% - 30px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--col-chart-grid)" />
                  <XAxis
                    dataKey="maquina_nombre"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    hide={breakdown.length > 6}
                    interval={0}
                    height={breakdown.length > 6 ? 0 : 36}
                  />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    cursor={{ fill: 'var(--col-gauge-track)' }}
                    contentStyle={{
                      background: 'var(--col-surface-md)',
                      border: '1px solid var(--col-border-lg)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--col-text-primary)',
                    }}
                  />
                  <Bar dataKey="avg_real" name="Real" fill={NEEDLE_COLOR} radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
