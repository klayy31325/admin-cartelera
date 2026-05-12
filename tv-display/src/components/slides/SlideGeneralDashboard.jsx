import { 
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, 
  Tooltip, CartesianGrid, Line, ComposedChart 
} from 'recharts';
import { TrendingUp, Zap, Percent, AlertCircle, Activity } from 'lucide-react';

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

export default function SlideGeneralDashboard({ data, isLoading, isMonthly }) {
  const produccion = data?.produccion ?? [];
  const paradas    = data?.paradas    ?? [];

  const totalMetros = produccion.reduce((a, c) => a + Number(c.total_metros ?? 0), 0);
  const avgEfic     = produccion.length 
    ? (produccion.reduce((a, c) => a + Number(c.eficiencia_promedio ?? 0), 0) / produccion.length).toFixed(1)
    : 0;

  // Preparar datos para Pareto (Paradas)
  const totalMinutosParada = paradas.reduce((a, c) => a + Number(c.total_minutos), 0);
  let acumulado = 0;
  const paretoData = paradas.map(p => {
    acumulado += Number(p.total_minutos);
    return {
      motivo: p.motivo_nombre,
      minutos: p.total_minutos,
      porcentaje: Math.round((acumulado / totalMinutosParada) * 100)
    };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr 1.2fr', gap: 20, height: '100%' }}>
      
      {/* Columna Izquierda: KPIs Verticales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TechKpi label={isMonthly ? "METROS MENSUALES" : "METROS PRODUCIDOS"} value={totalMetros.toLocaleString()} unit="m" trend="12" icon={TrendingUp} />
        <TechKpi label="VELOCIDAD ACTUAL" value="187" unit="m/min" icon={Zap} />
        <TechKpi label="% DESPERDICIO" value="2.7" unit="%" icon={Percent} />
      </div>

      {/* Columna Central: Análisis de Paradas (Pareto) */}
      <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} color="var(--col-brand)" />
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              {isMonthly ? "ANÁLISIS DE PARADAS MENSUAL" : "ANÁLISIS DE PARADAS (PARETO)"}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--col-text-muted)' }}>
            <span><span style={{ color: 'var(--col-brand)' }}>■</span> MINUTOS</span>
            <span><span style={{ color: 'var(--col-info)' }}>─</span> ACUMULADO %</span>
          </div>
        </header>

        <div style={{ flex: 1 }}>
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
        </div>
      </section>

      {/* Columna Derecha: Objetivos y Eventos */}
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
                strokeDasharray="377" strokeDashoffset={377 - (377 * (avgEfic/100))}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px var(--col-brand-glow))', transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="stat-number" style={{ fontSize: '32px', color: 'var(--col-text-primary)' }}>{Math.round(avgEfic)}%</span>
              <span style={{ fontSize: '9px', color: 'var(--col-text-muted)', fontWeight: 800 }}>OBJETIVO</span>
            </div>
          </div>
        </section>

        {/* Eventos Recientes */}
        <section className="glass" style={{ padding: '20px', flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 16 }}>EVENTOS RECIENTES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EventItem type="warn" title="STOP DETECTED" desc="Falta de insumo en rodillo B" time="14:20" />
            <EventItem type="info" title="RESUME" desc="Velocidad estabilizada 185m/min" time="14:05" />
            <EventItem type="danger" title="CRITICAL ALERT" desc="Desperdicio > 5% en Bobina 04" time="13:45" />
          </div>
        </section>
      </div>

    </div>
  );
}

function EventItem({ type, title, desc, time }) {
  const colors = {
    warn: 'var(--col-warn)',
    info: 'var(--col-info)',
    danger: 'var(--col-danger)'
  };
  return (
    <div style={{ borderLeft: `2px solid ${colors[type]}`, paddingLeft: 12, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: '9px', fontWeight: 800, color: colors[type] }}>{title}</span>
        <span style={{ fontSize: '9px', color: 'var(--col-text-muted)', fontFamily: 'var(--font-mono)' }}>{time}</span>
      </div>
      <p style={{ fontSize: '10px', color: 'var(--col-text-secondary)', lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}
