import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

function VelocityKpi({ label, value, unit }) {
  return (
    <div className="slide-velocity__kpi">
      <p className="slide-velocity__kpi-label">{label}</p>
      <div className="slide-velocity__kpi-value">
        <span>{value}</span>
        <span className="slide-velocity__kpi-unit">{unit}</span>
      </div>
    </div>
  );
}

function TVSpeedometer({ value = 0 }) {
  const percentage = Math.min(Math.max(Number(value) || 0, 0), 100);
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="slide-velocity__gauge">
      <svg viewBox="0 0 100 80" aria-hidden="true">
        <defs>
          <linearGradient id="tvSpeedGradientWhite" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((tick) => {
          const tickRot = (tick / 100) * 180 - 90;
          return (
            <line
              key={tick}
              x1="50"
              y1="12"
              x2="50"
              y2="18"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="1.5"
              transform={`rotate(${tickRot} 50 75)`}
            />
          );
        })}

        <path
          d="M 10 75 A 40 40 0 0 1 90 75"
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d="M 10 75 A 40 40 0 0 1 90 75"
          fill="none"
          stroke="url(#tvSpeedGradientWhite)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="125.6"
          strokeDashoffset={125.6 - (percentage / 100) * 125.6}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />

        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 40, damping: 14 }}
          style={{ transformOrigin: '50px 75px' }}
        >
          <line
            x1="50"
            y1="75"
            x2="50"
            y2="30"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="75"
            r="5"
            fill="#ffffff"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="2"
          />
        </motion.g>
      </svg>
    </div>
  );
}

export default function SlideVelocity({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_velocidad ?? [];
  const breakdown = maquina_id
    ? allBreakdown.filter((m) => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  const globalStats = maquina_id && breakdown.length > 0
    ? {
        promedio_real: breakdown[0].avg_real,
        promedio_teorica: breakdown[0].avg_teorica,
        rendimiento_pct: breakdown[0].rendimiento_pct,
      }
    : data?.velocidad ?? { promedio_real: 0, promedio_teorica: 0, rendimiento_pct: 0 };

  const showChart = !maquina_id && breakdown.length > 0;
  const pct = Math.round(Number(globalStats.rendimiento_pct) || 0);
  const tickStyle = { fill: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700 };

  return (
    <section className={`slide-velocity${showChart ? ' slide-velocity--split' : ''}`}>
      <header className="slide-velocity__header">
        <Gauge size={20} strokeWidth={5} />
        <h2 className="slide-velocity__title">
          Eficiencia de Velocidad{maquina ? ` · ${maquina}` : ''}
        </h2>
      </header>

      <div className="slide-velocity__body">
        <div className="slide-velocity__main">
          <TVSpeedometer value={pct} />

          <div className="slide-velocity__result">
            <span className="slide-velocity__pct">{pct}%</span>
            <p className="slide-velocity__caption">Rendimiento actual</p>
          </div>

          <div className="slide-velocity__kpis">
            <VelocityKpi label="Vel. real" value={globalStats.promedio_real} unit="u/h" />
            <VelocityKpi label="Vel. teórica" value={globalStats.promedio_teorica} unit="u/h" />
          </div>
        </div>

        {showChart && (
          <div className="slide-velocity__chart-panel">
            <h3 className="slide-velocity__chart-title">Desglose por línea</h3>
            <div className="slide-velocity__chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdown}
                  margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
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
                    cursor={{ fill: 'rgba(255,255,255,0.08)' }}
                    contentStyle={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="avg_real" name="Real" fill="#ffffff" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="avg_teorica" name="Teórica" fill="rgba(255,255,255,0.35)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
