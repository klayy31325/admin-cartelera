import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { AlertTriangle, Trash2, Layers } from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

function WasteKpi({ label, value, unit, color = 'var(--col-brand)' }) {
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

export default function SlideWaste({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_desperdicio ?? [];
  const global = data?.desperdicio ?? { total_kg: 0, total_ml: 0 };

  // Filtrar si es una máquina específica
  const breakdown = maquina_id 
    ? allBreakdown.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 20, height: '100%' }}>
      
      {/* Header KPIs */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="glass" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid #ef4444' }}>
          <Trash2 size={32} color="#ef4444" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800 }}>{maquina ? 'UNIDAD SELECCIONADA' : 'DASHBOARD GLOBAL'}</p>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>
              {maquina ? maquina : 'ANÁLISIS DE DESPERDICIO'}
            </h2>
          </div>
        </div>
        <WasteKpi label={maquina ? "DESPERDICIO UNIDAD" : "TOTAL DESPERDICIO"} value={Number(global.total_kg).toFixed(1)} unit="kg" color="#ef4444" />
        <WasteKpi label={maquina ? "LINEAL UNIDAD" : "TOTAL LINEAL"} value={Number(global.total_ml).toLocaleString()} unit="ml" color="var(--col-text-muted)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, minHeight: 0 }}>
        
        {/* Breakdown Chart */}
        <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Layers size={16} color="#ef4444" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              DISTRIBUCIÓN POR UNIDAD (KG)
            </h2>
          </header>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="maquina_nombre" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: 'var(--col-surface-md)', border: '1px solid var(--col-border)' }}
                />
                <Bar dataKey="total_kg" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50}>
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              DETALLE POR MÁQUINA
            </h2>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {breakdown.map((m, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'white' }}>{m.maquina_nombre}</span>
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 900 }}>{Number(m.total_kg).toFixed(1)} kg</span>
                </div>
                <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', marginTop: 8, borderRadius: 1 }}>
                  <div style={{ width: `${Math.min((m.total_kg / global.total_kg) * 100, 100)}%`, height: '100%', background: '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
