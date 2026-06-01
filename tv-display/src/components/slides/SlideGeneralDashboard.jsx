import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer,
  Tooltip, CartesianGrid, Line, ComposedChart
} from 'recharts';
import { TrendingUp, Zap, Percent, AlertCircle, Activity, Clock } from 'lucide-react';

const COLORS = ['var(--col-brand)', 'var(--col-warn)', 'var(--col-danger)', 'var(--col-info)', 'var(--col-text-muted)'];

function TechKpi({ label, value, unit, trend, icon: Icon, variant = 'glass' }) {
  const isBrand = variant === 'glass-brand';
  return (
    <div className={variant} style={{ padding: '12px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <p style={{ fontSize: '9px', color: isBrand ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em' }}>{label}</p>
        {trend && <span style={{ fontSize: '9px', color: isBrand ? 'white' : 'var(--col-success)', fontFamily: 'var(--font-mono)' }}>+{trend}%</span>}
      </header>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <p className="stat-number" style={{ fontSize: '32px', color: isBrand ? 'white' : 'var(--col-text-primary)', lineHeight: 1.1 }}>{value}</p>
        <span style={{ fontSize: '11px', color: isBrand ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 8, height: 2, background: isBrand ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '70%', background: isBrand ? 'white' : 'var(--col-brand)', boxShadow: isBrand ? 'none' : '0 0 8px var(--col-brand-glow)' }} />
      </div>
    </div>
  );
}

export default function SlideGeneralDashboard({ data, isLoading, isMonthly, maquina, maquina_id }) {
  const allProduccion = data?.produccion ?? [];

  console.log(data);

  // Filtrar si tenemos una máquina específica asignada a esta TV
  const produccion = maquina_id
    ? allProduccion.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allProduccion;

  const allBreakdown = data?.breakdown_velocidad ?? [];

  // Si tenemos maquina_id, filtramos para mostrar solo esa máquina o resaltarla
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

  const paradas = maquina_id
    ? (data?.paradas?.filter(p => Number(p.maquina_id) === Number(maquina_id)) ?? [])
    : (data?.paradas ?? []);

  const desperdicio = maquina_id && data?.breakdown_desperdicio
    ? data.breakdown_desperdicio.find(m => Number(m.maquina_id) === Number(maquina_id)) || { total_kg: 0 }
    : data?.desperdicio ?? { total_kg: 0 };

  const totalMetros = produccion.reduce((a, c) => a + Number(c.total_metros ?? 0), 0);
  const avgEfic = produccion.length
    ? (produccion.reduce((a, c) => a + Number(c.eficiencia_promedio ?? 0), 0) / produccion.length)
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
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr', gap: 20, height: '100%' }}>
      {/* Columna Izquierda: KPIs Verticales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <TechKpi
          label={isMonthly ? "METROS MENSUALES" : "METROS PRODUCIDOS"}
          value={totalMetros.toLocaleString()}
          unit="m"
          icon={TrendingUp}
          variant="glass-brand"
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

      {/* Columna Central: Análisis de Paradas (Pareto) - AHORA MÁS GRANDE */}
      <section className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Machine Identity Badge */}
        {maquina && (
          <div style={{
            position: 'absolute',
            top: 32,
            right: 32,
            background: 'var(--col-brand)',
            color: 'white',
            fontSize: '11px',
            fontWeight: 900,
            padding: '6px 16px',
            borderRadius: '4px',
            boxShadow: '0 0 15px var(--col-brand-glow)',
            zIndex: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            UNIT: {maquina}
          </div>
        )}

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity size={20} color="var(--col-brand)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
              {isMonthly ? "ANÁLISIS DE PARADAS MENSUAL" : "ANÁLISIS DE PARADAS (PARETO)"}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--col-text-muted)', marginRight: maquina ? 150 : 0 }}>
            <span><span style={{ color: 'var(--col-brand)' }}>■</span> MINUTOS</span>
            <span><span style={{ color: 'var(--col-info)' }}>─</span> ACUMULADO %</span>
          </div>
        </header>

        <div style={{ flex: 1 }}>
          {paretoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="motivo" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 11, fontWeight: 700 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: 'var(--col-surface-md)', border: '1px solid var(--col-border)', borderRadius: 4 }}
                  itemStyle={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                />
                <Bar yAxisId="left" dataKey="minutos" fill="var(--col-brand)" radius={[4, 4, 0, 0]} barSize={60} isAnimationActive={false}>
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="porcentaje" stroke="var(--col-info)" strokeWidth={3} dot={{ r: 6, fill: 'var(--col-info)' }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--col-text-muted)' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>SIN PARADAS REGISTRADAS</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

