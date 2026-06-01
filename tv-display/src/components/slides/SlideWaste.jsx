import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { AlertTriangle, Trash2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['var(--col-brand)', 'var(--col-warn)', 'var(--col-danger)', 'var(--col-info)', 'var(--col-text-muted)'];

function WasteKpi({ label, value, unit, color = 'var(--col-brand)', variant = 'glass' }) {
  const isBrand = variant === 'glass-brand';
  return (
    <div className={variant} style={{ padding: '24px', flex: 1 }}>
      <p style={{ fontSize: '10px', color: isBrand ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="stat-number" style={{ fontSize: '32px', color: isBrand ? 'white' : color }}>{value}</span>
        <span style={{ fontSize: '12px', color: isBrand ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

function AnimatedGiantTrashCan({ valueKg, valueMl }) {
  // Rellenamos el bote visualmente a un 75% fijo como estética (ya que no hay un límite máximo definido)
  const percentage = 75; 
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50, height: '100%', justifyContent: 'center' }}>
      <div style={{ 
        width: 380, height: 500, 
        border: '12px solid rgba(255,255,255,0.1)', 
        borderTop: 'none', 
        borderRadius: '0 0 32px 32px', 
        position: 'relative', 
        overflow: 'visible',
        background: 'rgba(0,0,0,0.2)'
      }}>
        {/* Tapa del contenedor */}
        <div style={{ 
          position: 'absolute', top: -12, left: -32, right: -32, height: 24, 
          background: 'rgba(255,255,255,0.4)', borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
        }} />
        <div style={{ 
          position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', width: 120, height: 24, 
          background: 'rgba(255,255,255,0.4)', borderRadius: '12px 12px 0 0'
        }} />
        
        {/* Contenido (Basura llenándose) */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '0 0 20px 20px' }}>
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            style={{ 
              position: 'absolute', bottom: 0, left: 0, right: 0, 
              background: 'var(--col-danger)',
              opacity: 0.85,
              boxShadow: 'inset 0 10px 40px rgba(0,0,0,0.4)'
            }} 
          />
        </div>

        {/* Textura rayada del contenedor */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-evenly', opacity: 0.1, pointerEvents: 'none' }}>
          <div style={{ width: 8, height: '100%', background: 'white' }} />
          <div style={{ width: 8, height: '100%', background: 'white' }} />
          <div style={{ width: 8, height: '100%', background: 'white' }} />
        </div>
      </div>
      
      {/* Datos Abajo */}
      <div style={{ textAlign: 'center', display: 'flex', gap: 80, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '90px', fontWeight: 900, color: 'var(--col-danger)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {valueKg} <span style={{ fontSize: '32px', color: 'var(--col-text-muted)' }}>kg</span>
          </p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.1em', marginTop: 12 }}>PESO ACUMULADO</p>
        </div>
        
        <div style={{ width: 3, height: 100, background: 'rgba(255,255,255,0.1)' }} />
        
        <div>
          <p style={{ fontSize: '70px', fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {valueMl} <span style={{ fontSize: '28px', color: 'var(--col-text-muted)' }}>ml</span>
          </p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--col-text-muted)', letterSpacing: '0.1em', marginTop: 12 }}>LONGITUD PERDIDA</p>
        </div>
      </div>
    </div>
  );
}

export default function SlideWaste({ data, maquina, maquina_id }) {
  const allBreakdown = data?.breakdown_desperdicio ?? [];

  // Filtrar si es una máquina específica
  const breakdown = maquina_id
    ? allBreakdown.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allBreakdown;

  const global = maquina_id && breakdown.length > 0
    ? { total_kg: breakdown[0].total_kg, total_ml: breakdown[0].total_ml }
    : data?.desperdicio ?? { total_kg: 0, total_ml: 0 };

  return (
    <div style={{ display: 'grid', gridTemplateRows: maquina ? '1fr' : 'auto 1fr', gap: 20, height: '100%' }}>

      {maquina ? (
        <section className="glass" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
          <AnimatedGiantTrashCan valueKg={Number(global.total_kg).toFixed(1)} valueMl={Number(global.total_ml).toLocaleString()} />
          
          <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Trash2 size={48} color="var(--col-danger)" />
            <div>
              <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
                {maquina}
              </h2>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Header KPIs */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="glass" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--col-danger)' }}>
              <Trash2 size={32} color="var(--col-danger)" />
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
                  ANÁLISIS DE DESPERDICIO
                </h2>
              </div>
            </div>
            <WasteKpi label="TOTAL DESPERDICIO" value={Number(global.total_kg).toFixed(1)} unit="kg" color="var(--col-danger)" variant="glass-brand" />
            <WasteKpi label="TOTAL LINEAL" value={Number(global.total_ml).toLocaleString()} unit="ml" color="var(--col-text-muted)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, minHeight: 0 }}>

            {/* Breakdown Chart */}
            <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Layers size={16} color="var(--col-danger)" />
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
                    <Bar dataKey="total_kg" fill="var(--col-danger)" radius={[4, 4, 0, 0]} barSize={50}>
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
                <AlertTriangle size={16} color="var(--col-danger)" />
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
                  DETALLE POR MÁQUINA
                </h2>
              </header>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {breakdown.map((m, i) => (
                  <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--col-text-primary)' }}>{m.maquina_nombre}</span>
                      <span style={{ fontSize: '12px', color: 'var(--col-danger)', fontWeight: 900 }}>{Number(m.total_kg).toFixed(1)} kg</span>
                    </div>
                    <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', marginTop: 8, borderRadius: 1 }}>
                      <div style={{ width: `${Math.min((m.total_kg / global.total_kg) * 100, 100)}%`, height: '100%', background: 'var(--col-danger)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </>
      )}
    </div>
  );
}

