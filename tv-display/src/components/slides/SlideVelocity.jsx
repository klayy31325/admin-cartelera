import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Activity, Zap, Gauge } from 'lucide-react';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

function VelocityKpi({ label, value, unit, color = 'var(--col-brand)' }) {
  return (
    <div className="glass" style={{ padding: '24px', flex: 1 }}>
      <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="stat-number" style={{ fontSize: '32px', color }}>{value}</span>
        <span style={{ fontSize: '12px', color: 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function SlideVelocity({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_velocidad ?? [];
  const global = data?.velocidad ?? { promedio_real: 0, promedio_teorica: 0, rendimiento_pct: 0 };

  // Si tenemos maquina_id, filtramos para mostrar solo esa máquina o resaltarla
  const breakdown = maquina_id 
    ? allBreakdown.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 20, height: '100%' }}>
      
      {/* Header KPIs */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="glass" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--col-brand)' }}>
          <Gauge size={32} color="var(--col-brand)" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800 }}>{maquina ? 'UNIDAD SELECCIONADA' : 'DASHBOARD GLOBAL'}</p>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>
              {maquina ? maquina : 'RENDIMIENTO VELOCIDAD'}
            </h2>
          </div>
        </div>
        <VelocityKpi label={maquina ? "PROMEDIO REAL" : "PROMEDIO GLOBAL"} value={global.promedio_real} unit="ml/min" />
        <VelocityKpi label={maquina ? "TARGET MÁQUINA" : "PROMEDIO TARGET"} value={global.promedio_teorica} unit="ml/min" color="var(--col-text-muted)" />
        <VelocityKpi label="EFICIENCIA" value={`${global.rendimiento_pct}%`} unit="" color="var(--col-success)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, minHeight: 0 }}>
        
        {/* Breakdown Chart */}
        <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Activity size={16} color="var(--col-brand)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              EFICIENCIA DE VELOCIDAD POR UNIDAD
            </h2>
          </header>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="maquina_nombre" type="category" axisLine={false} tickLine={false} tick={{ fill: 'white', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: 'var(--col-surface-md)', border: '1px solid var(--col-border)' }}
                />
                <Bar dataKey="rendimiento_pct" fill="var(--col-brand)" radius={[0, 2, 2, 0]} barSize={20}>
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rendimiento_pct >= 80 ? 'var(--col-success)' : entry.rendimiento_pct >= 60 ? 'var(--col-warn)' : '#ef4444'} />
                  ))}
                </Bar>
                <ReferenceLine x={80} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" label={{ value: 'TARGET', position: 'top', fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Technical List */}
        <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Zap size={16} color="var(--col-brand)" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              MÉTRICAS POR MÁQUINA
            </h2>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {breakdown.map((m, i) => (
              <div key={i} style={{ borderLeft: '2px solid var(--col-brand)', paddingLeft: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'white' }}>{m.maquina_nombre}</span>
                  <span style={{ fontSize: '11px', color: 'var(--col-brand)', fontWeight: 700 }}>{m.rendimiento_pct}%</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: '9px', color: 'var(--col-text-muted)' }}>
                  <span>REAL: {m.avg_real}</span>
                  <span>TARGET: {m.avg_teorica}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
