import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Activity, Zap, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['var(--col-brand)', 'var(--col-warn)', 'var(--col-danger)', 'var(--col-info)', 'var(--col-text-muted)'];

function VelocityKpi({ label, value, unit, color = 'var(--col-brand)', variant = 'glass' }) {
  return (
    <div className={variant} style={{ padding: '24px', flex: 1 }}>
      <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8, opacity: variant === 'glass-brand' ? 0.8 : 1 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="stat-number" style={{ fontSize: '32px', color: variant === 'glass-brand' ? 'white' : color }}>{value}</span>
        <span style={{ fontSize: '12px', color: variant === 'glass-brand' ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

function Speedometer({ value = 0, size = 160, onDark = false }) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const rotation = (percentage / 100) * 180 - 90;

  const mainColor = onDark ? 'white' : 'var(--col-brand)';
  const trackColor = onDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';

  return (
    <div style={{ position: 'relative', width: size, height: size * 0.65, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', margin: '0 auto' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Ticks and Markings */}
        {[0, 25, 50, 75, 100].map(tick => {
          const tickRot = (tick / 100) * 180 - 90;
          return (
            <line
              key={tick}
              x1="50" y1="15" x2="50" y2="20"
              stroke={onDark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}
              strokeWidth="1"
              transform={`rotate(${tickRot} 50 90)`}
            />
          );
        })}

        {/* Background Track */}
        <path
          d="M 10 90 A 40 40 0 0 1 90 90"
          fill="none"
          stroke={trackColor}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress Track */}
        <path
          d="M 10 90 A 40 40 0 0 1 90 90"
          fill="none"
          stroke={mainColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="125.6"
          strokeDashoffset={125.6 - (percentage / 100) * 125.6}
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 50, damping: 12, mass: 1.5 }}
          style={{ originX: '50px', originY: '90px' }}
        >
          <line x1="50" y1="90" x2="50" y2="50" stroke={onDark ? 'white' : 'white'} strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="90" r="5" fill="white" />
          <circle cx="50" cy="90" r="2" fill={onDark ? 'var(--col-brand)' : 'var(--col-brand)'} />
        </motion.g>
      </svg>
    </div>
  );
}

export default function SlideVelocity({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_velocidad ?? [];

  const breakdown = maquina_id
    ? allBreakdown.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  const global = maquina_id && breakdown.length > 0
    ? {
      promedio_real: breakdown[0].avg_real,
      promedio_teorica: breakdown[0].avg_teorica,
      rendimiento_pct: breakdown[0].rendimiento_pct
    }
    : data?.velocidad ?? { promedio_real: 0, promedio_teorica: 0, rendimiento_pct: 0 };

  return (
    <section className="glass-brand" style={{ padding: '40px', position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>

      {/* Esquina superior izquierda: Título */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ position: 'absolute', top: 10, left: 20 }}
      >
        <h2 style={{ fontSize: '40px', fontWeight: 900, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Eficiencia de Velocidad
        </h2>
      </motion.div>

      {/* Centro: Velocímetro más pequeño */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: "-25%", y: "-25%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      >
        <Speedometer value={global.rendimiento_pct} size={300} onDark={true} />
      </motion.div>

      {/* Esquina contraria (inferior derecha): Datos del velocímetro */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        style={{ position: 'absolute', bottom: 40, right: 40, textAlign: 'right' }}
      >
        <span style={{ fontSize: '60px', fontWeight: 100, color: 'white', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {global.rendimiento_pct}%
        </span>
        <p style={{ fontSize: '14px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', margin: '8px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Rendimiento Actual
        </p>
      </motion.div>

    </section>
  );
}

