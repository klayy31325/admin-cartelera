import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area, ComposedChart 
} from 'recharts';
import { Cpu, Zap, AlertTriangle, Activity } from 'lucide-react';

function StatCard({ label, value, unit, color = 'primary' }) {
  const colors = {
    primary: 'var(--col-text-primary)',
    brand: 'var(--col-brand)',
    success: 'var(--col-success)',
    warn: 'var(--col-warn)',
    danger: '#ef4444', // Red for low efficiency
  };
  return (
    <div className="glass" style={{ padding: '20px', flex: 1 }}>
      <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="stat-number" style={{ fontSize: '28px', color: colors[color] }}>{value}</span>
        <span style={{ fontSize: '12px', color: 'var(--col-text-muted)', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function SlideMachineFocus({ data, velocity, maquina, isMonthly }) {
  const produccion = data?.produccion ?? [];
  const paradas    = data?.paradas    ?? [];

  // Buscar la data específica de esta máquina en los resultados del resumen
  const machineData = produccion.find(p => p.maquina_nombre?.toUpperCase() === maquina?.toUpperCase());
  
  if (!machineData) {
    console.warn(`[SlideMachineFocus] No data found for machine: "${maquina}". Available:`, produccion.map(p => p.maquina_nombre));
  }
  const machineStops = paradas.slice(0, 5); // Ya vienen filtradas por maquina_id desde la API

  // Usar los datos de velocidad reales si existen, sino usar placeholder vacío
  const velocityData = velocity && velocity.length > 0 ? velocity : [
    { hora: '00:00', real: 0, target: 100 },
  ];

  const efic = machineData?.eficiencia_promedio ?? 0;
  const eficColor = efic >= 80 ? 'success' : efic >= 60 ? 'warn' : 'danger';

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 20, height: '100%' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="glass" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 20, borderLeft: '4px solid var(--col-brand)' }}>
          <Cpu size={32} color="var(--col-brand)" />
          <div>
            <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 800 }}>UNIT IDENTIFIER</p>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{maquina}</h2>
          </div>
        </div>
        <StatCard label={isMonthly ? "METROS MENSUALES" : "METROS PRODUCIDOS"} value={Number(machineData?.total_metros ?? 0).toLocaleString()} unit="m" color="brand" />
        <StatCard label={isMonthly ? "EFICIENCIA MENSUAL" : "EFICIENCIA ACTUAL"} value={Math.round(efic)} unit="%" color={eficColor} />
        <StatCard label={isMonthly ? "PARADA MENSUAL" : "TIEMPO DETENIDA"} value={Math.round(machineData?.total_minutos ?? 0)} unit="min" color="warn" />
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
                    <stop offset="5%" stopColor="var(--col-brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--col-brand)" stopOpacity={0}/>
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

        {/* Logs / Incidents */}
        <section className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
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
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'white' }}>{stop.motivo_nombre}</span>
                  <span style={{ fontSize: '10px', color: 'var(--col-warn)', fontFamily: 'var(--font-mono)' }}>{stop.total_minutos} MIN</span>
                </div>
                <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <div style={{ width: `${Math.min((stop.total_minutos/60)*100, 100)}%`, height: '100%', background: 'var(--col-warn)' }} />
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--col-text-muted)', fontSize: '12px', textAlign: 'center', marginTop: 40 }}>SISTEMA NOMINAL - SIN PARADAS</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
