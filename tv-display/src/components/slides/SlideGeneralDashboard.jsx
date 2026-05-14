import { 
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, 
  Tooltip, CartesianGrid, Line, ComposedChart 
} from 'recharts';
import { TrendingUp, Zap, Percent, AlertCircle, Activity, Clock } from 'lucide-react';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

function TechKpi({ label, value, unit, trend, icon: Icon }) {
  return (
    <div className="glass" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em' }}>{label}</p>
        {trend && <span style={{ fontSize: '10px', color: 'var(--col-success)', fontFamily: 'var(--font-mono)' }}>+{trend}%</span>}
      </header>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <p className="stat-number" style={{ fontSize: 'var(--text-2xl)', color: 'var(--col-text-primary)' }}>{value}</p>
        <span style={{ fontSize: '12px', color: 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 16, height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '70%', background: 'var(--col-brand)', boxShadow: '0 0 8px var(--col-brand-glow)' }} />
      </div>
    </div>
  );
}

export default function SlideGeneralDashboard({ data, isLoading, isMonthly, maquina, maquina_id }) {
  const allProduccion = data?.produccion ?? [];
  const paradas    = data?.paradas    ?? [];
  const desperdicio = data?.desperdicio ?? { total_kg: 0 };

  // Filtrar si tenemos una máquina específica asignada a esta TV
  const produccion = maquina_id 
    ? allProduccion.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allProduccion;

  const totalMetros = produccion.reduce((a, c) => a + Number(c.total_metros ?? 0), 0);
  const avgEfic     = produccion.length 
    ? (produccion.reduce((a, c) => a + Number(c.eficiencia_promedio ?? 0), 0) / produccion.length).toFixed(1)
    : 0;
  const totalMinutosParada = paradas.reduce((a, c) => a + Number(c.total_minutos ?? 0), 0);

  // Preparar datos para Pareto (Paradas)
  let acumulado = 0;
  const paretoData = paradas.map(p => {
    acumulado += Number(p.total_minutos);
    return {
      motivo: p.motivo_nombre,
      minutos: Number(p.total_minutos),
      porcentaje: totalMinutosParada > 0 
        ? Math.round((acumulado / totalMinutosParada) * 100) 
        : 0
    };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr 1.2fr', gap: 20, height: '100%' }}>
      
      {/* Columna Izquierda: KPIs Verticales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TechKpi 
          label={isMonthly ? "METROS MENSUALES" : "METROS PRODUCIDOS"} 
          value={totalMetros.toLocaleString()} 
          unit="m" 
          icon={TrendingUp} 
        />
        <TechKpi 
          label="TIEMPO EN PARADA" 
          value={totalMinutosParada.toLocaleString()} 
          unit="min" 
          icon={Clock} 
        />
        <TechKpi 
          label="DESPERDICIO" 
          value={Number(desperdicio.total_kg).toFixed(1)} 
          unit="kg" 
          icon={AlertCircle} 
        />
      </div>

      {/* Columna Central: Análisis de Paradas (Pareto) */}
      <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Machine Identity Badge */}
        {maquina && (
          <div style={{ 
            position: 'absolute', 
            top: 24, 
            right: 24, 
            background: 'var(--col-brand)', 
            color: 'white', 
            fontSize: '10px', 
            fontWeight: 900, 
            padding: '4px 12px', 
            borderRadius: '4px',
            boxShadow: '0 0 15px var(--col-brand-glow)',
            zIndex: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            UNIT: {maquina}
          </div>
        )}

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} color="var(--col-brand)" />
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              {isMonthly ? "ANÁLISIS DE PARADAS MENSUAL" : "ANÁLISIS DE PARADAS (PARETO)"}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--col-text-muted)', marginRight: maquina ? 120 : 0 }}>
            <span><span style={{ color: 'var(--col-brand)' }}>■</span> MINUTOS</span>
            <span><span style={{ color: 'var(--col-info)' }}>─</span> ACUMULADO %</span>
          </div>
        </header>

        <div style={{ flex: 1 }}>
          {paretoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="motivo" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10, fontWeight: 700 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10 }} unit="%" />
                <Tooltip 
                  contentStyle={{ background: 'var(--col-surface-md)', border: '1px solid var(--col-border)', borderRadius: 4 }}
                  itemStyle={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                />
                <Bar yAxisId="left" dataKey="minutos" fill="var(--col-brand)" radius={[2, 2, 0, 0]} barSize={40}>
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="porcentaje" stroke="var(--col-info)" strokeWidth={2} dot={{ r: 4, fill: 'var(--col-info)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--col-text-muted)' }}>
              <p style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>SIN PARADAS REGISTRADAS</p>
            </div>
          )}
        </div>
      </section>

      {/* Columna Derecha: Objetivos y Resumen por Máquina */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Meta Circular */}
        <section className="glass" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 20 }}>
            {isMonthly ? "META MENSUAL" : "META DIARIA"}
          </p>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle 
                cx="70" cy="70" r="60" fill="none" stroke="var(--col-brand)" strokeWidth="12" 
                strokeDasharray="377" strokeDashoffset={377 - (377 * Math.min(avgEfic, 100) / 100)}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px var(--col-brand-glow))', transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="stat-number" style={{ fontSize: '32px', color: 'var(--col-text-primary)' }}>{Math.round(avgEfic)}%</span>
              <span style={{ fontSize: '9px', color: 'var(--col-text-muted)', fontWeight: 800 }}>EFICIENCIA</span>
            </div>
          </div>
        </section>

        {/* Resumen por Máquina y Desperdicio */}
        <section className="glass" style={{ padding: '20px', flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 16 }}>
            {maquina_id ? `ESTADO: ${maquina}` : "DETALLE POR UNIDAD"}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.breakdown_desperdicio || produccion).map((m, i) => {
              // Buscar datos de producción para esta máquina si estamos en breakdown_desperdicio
              const prod = produccion.find(p => Number(p.maquina_id) === Number(m.maquina_id));
              const metros = Number(prod?.total_metros ?? 0);
              const efic = Number(prod?.eficiencia_promedio ?? 0);
              const wasteKg = Number(m.total_kg ?? 0);
              
              const color = metros > 0 ? 'var(--col-success)' : 'var(--col-text-muted)';
              
              return (
                <div key={m.maquina_id} style={{ borderLeft: `2px solid ${color}`, paddingLeft: 12, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'white' }}>{m.maquina_nombre}</span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: 'var(--col-brand)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        {metros.toLocaleString()} m
                      </p>
                      <p style={{ fontSize: '9px', color: '#ef4444', fontWeight: 800 }}>
                        {wasteKg.toFixed(1)} kg <span style={{fontSize: '7px', opacity: 0.6}}>DESP.</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                    <div style={{ 
                      width: `${Math.min(efic, 100)}%`, 
                      height: '100%', 
                      background: color,
                      transition: 'width 0.8s ease-out',
                      boxShadow: metros > 0 ? `0 0 5px ${color}` : 'none'
                    }} />
                  </div>
                </div>
              );
            })}
            {(!data?.breakdown_desperdicio && produccion.length === 0) && (
              <p style={{ color: 'var(--col-text-muted)', fontSize: '12px', textAlign: 'center', marginTop: 40 }}>SIN DATOS DISPONIBLES</p>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
