import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';
import { Cpu, Zap, AlertTriangle, Activity } from 'lucide-react';

function StatCard({ label, value, unit, color = 'primary', variant = 'glass' }) {
  const colors = {
    primary: 'var(--col-text-primary)',
    brand: 'var(--col-brand)',
    success: 'var(--col-success)',
    warn: 'var(--col-warn)',
    danger: 'var(--col-danger)',
  };
  const isBrand = variant === 'glass-brand';
  return (
    <div className={variant} style={{ padding: '20px', flex: 1 }}>
      <p style={{ fontSize: '10px', color: isBrand ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="stat-number" style={{ fontSize: '28px', color: isBrand ? 'white' : colors[color] }}>{value}</span>
        <span style={{ fontSize: '12px', color: isBrand ? 'rgba(255,255,255,0.7)' : 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function SlideMachineFocus({ data, velocity, maquina, maquina_id, isMonthly }) {
  const produccion = data?.produccion ?? [];
  const paradas = data?.paradas ?? [];

  // Buscar la data específica de esta máquina si se nos pasó un ID (caso de rotación genérica)
  const machineData = maquina_id
    ? produccion.find(p => Number(p.maquina_id) === Number(maquina_id))
    : produccion[0] || null;

  // Filtrar desperdicio específico
  const desperdicio = maquina_id && data?.breakdown_desperdicio
    ? data.breakdown_desperdicio.find(m => Number(m.maquina_id) === Number(maquina_id)) || { total_kg: 0 }
    : data?.desperdicio ?? { total_kg: 0 };

  // Filtrar paradas específicas de esta máquina
  const machineStops = maquina_id
    ? paradas.filter(p => Number(p.maquina_id) === Number(maquina_id)).slice(0, 5)
    : paradas.slice(0, 5);

  // Filtrar trabajos específicos de esta máquina
  const machineJobs = maquina_id
    ? (data?.trabajos?.filter(t => Number(t.maquina_id) === Number(maquina_id)) ?? []).slice(0, 4)
    : (data?.trabajos ?? []).slice(0, 4);

  // Usar los datos de velocidad reales si existen
  const velocityData = velocity && velocity.length > 0 ? velocity : [
    { hora: '00:00', real: 0, target: 100 },
  ];

  const efic = Number(machineData?.eficiencia_promedio ?? 0);
  const totalMinutos = Number(machineData?.total_minutos ?? 0);
  const eficColor = efic >= 80 ? 'success' : efic >= 60 ? 'warn' : 'danger';

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 20, height: '100%' }}>

      {/* Header Info */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="glass" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--col-brand)' }}>
          <Cpu size={32} color="var(--col-brand)" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800 }}>UNIT IDENTIFIER</p>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>{maquina}</h2>
          </div>
        </div>
        <StatCard label={isMonthly ? "METROS MENSUALES" : "METROS PRODUCIDOS"} value={Number(machineData?.total_metros ?? 0).toLocaleString()} unit="m" color="brand" variant="glass-brand" />
        <StatCard label="TIEMPO PARADA" value={Math.round(totalMinutos)} unit="min" color="warn" />
        <StatCard label="DESPERDICIO" value={Number(desperdicio.total_kg).toFixed(1)} unit="kg" color="danger" />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, minHeight: 0 }}>

        {/* Performance Chart */}
        <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={16} color="var(--col-brand)" />
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
                RENDIMIENTO DE VELOCIDAD (REAL VS TARGET)
              </h2>
            </div>
          </header>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={velocityData}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--col-brand)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--col-brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--col-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--col-surface-md)', border: '1px solid var(--col-border)', borderRadius: 2 }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                />
                <Area type="monotone" dataKey="real" stroke="var(--col-brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
                <Line type="monotone" dataKey="target" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Logs / Incidents & Jobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <section className="glass" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <AlertTriangle size={16} color="var(--col-warn)" />
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
                INCIDENCIAS DETECTADAS
              </h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {machineStops.length > 0 ? machineStops.map((stop, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--col-warn)', paddingLeft: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--col-text-primary)' }}>{stop.motivo_nombre}</span>
                    <span style={{ fontSize: '10px', color: 'var(--col-warn)', fontFamily: 'var(--font-mono)' }}>{stop.total_minutos} MIN</span>
                  </div>
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                    <div style={{ width: `${Math.min((stop.total_minutos / 60) * 100, 100)}%`, height: '100%', background: 'var(--col-warn)' }} />
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--col-text-muted)', fontSize: '10px', textAlign: 'center', marginTop: 10 }}>SISTEMA NOMINAL</p>
              )}
            </div>
          </section>

          <section className="glass" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Zap size={16} color="var(--col-brand)" />
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', letterSpacing: '0.05em' }}>
                TRABAJOS RECIENTES
              </h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {machineJobs.length > 0 ? machineJobs.map((t, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--col-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                      {t.producto_nombre}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--col-brand)', fontWeight: 700 }}>{Number(t.metros_producidos).toLocaleString()} m</span>
                  </div>
                  <p style={{ fontSize: '8px', color: 'var(--col-text-muted)', marginTop: 4 }}>{t.cliente_nombre}</p>
                </div>
              )) : (
                <p style={{ color: 'var(--col-text-muted)', fontSize: '10px', textAlign: 'center' }}>SIN TRABAJOS HOY</p>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
