import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-md" style={{ padding: '12px', border: '1px solid var(--col-brand-glow)' }}>
      <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="stat-number" style={{ fontSize: '18px', color: 'var(--col-brand)' }}>{payload[0].value}%</span>
        <span style={{ fontSize: '10px', color: 'var(--col-text-muted)' }}>EFICIENCIA</span>
      </div>
    </div>
  );
}

export default function SlideProduction({ data }) {
  const produccion = data?.produccion ?? [];

  return (
    <div className="glass" style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: 'var(--col-brand-dim)', borderRadius: 4 }}>
            <Activity size={20} color="var(--col-brand)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.02em' }}>
              EFICIENCIA OPERATIVA POR MÁQUINA
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              MONITOREO EN TIEMPO REAL · DATOS DE PRODUCCIÓN
            </p>
          </div>
        </div>
        <div className="badge badge-brand">STATUS: OPTIMIZED</div>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={produccion} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="maquina" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--col-text-muted)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }} 
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--col-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar 
              dataKey="eficiencia_promedio" 
              radius={[2, 2, 0, 0]} 
              barSize={60}
              animationDuration={1000}
            >
              {produccion.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  style={{ filter: 'drop-shadow(0 0 4px var(--col-brand-glow))' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer style={{ marginTop: 24, display: 'flex', gap: 32, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: 'var(--col-text-muted)' }}>MÁXIMA EFICIENCIA</span>
          <span className="stat-number" style={{ fontSize: '14px', color: 'var(--col-success)' }}>
            {Math.max(...produccion.map(p => p.eficiencia_promedio || 0), 0)}%
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: 'var(--col-text-muted)' }}>PROMEDIO PLANTA</span>
          <span className="stat-number" style={{ fontSize: '14px', color: 'var(--col-brand)' }}>
            {(produccion.reduce((a, b) => a + (b.eficiencia_promedio || 0), 0) / (produccion.length || 1)).toFixed(1)}%
          </span>
        </div>
      </footer>
    </div>
  );
}
