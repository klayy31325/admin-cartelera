import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer,
  Tooltip, CartesianGrid, Line, ComposedChart
} from 'recharts';
const COLORS = ['var(--col-brand)', 'var(--col-warn)', 'var(--col-danger)', 'var(--col-info)', 'var(--col-text-muted)'];

function TechKpi({ label, value, unit, variant = 'neutral' }) {
  return (
    <div className={`tv-kpi tv-kpi--${variant}`}>
      <p className="tv-kpi__label">{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <p className="stat-number tv-kpi__value">{value}</p>
        <span className="tv-kpi__unit">{unit}</span>
      </div>
      <div className="tv-kpi__bar-track">
        <div className="tv-kpi__bar-fill" />
      </div>
    </div>
  );
}

export default function SlideGeneralDashboard({ data, isLoading, isMonthly, maquina, maquina_id }) {
  const allProduccion = data?.produccion ?? [];

  const fallbackMonth = data?._fallbackMonth;
  const dataMonth = data?._dataMonth;

  const produccion = maquina_id
    ? allProduccion.filter(m => Number(m.maquina_id) === Number(maquina_id))
    : allProduccion;

  const paradas = maquina_id
    ? (data?.paradas?.filter(p => Number(p.maquina_id) === Number(maquina_id)) ?? [])
    : (data?.paradas ?? []);

  const desperdicio = maquina_id && data?.breakdown_desperdicio
    ? data.breakdown_desperdicio.find(m => Number(m.maquina_id) === Number(maquina_id)) || { total_kg: 0 }
    : data?.desperdicio ?? { total_kg: 0 };

  const totalMetros = produccion.reduce((a, c) => a + Number(c.total_metros ?? 0), 0);
  const totalMinutosParada = paradas.reduce((a, c) => a + Number(c.total_minutos ?? 0), 0);

  const dataMonthLabel = dataMonth
    ? new Date(dataMonth + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    : null;

  let acumulado = 0;
  const paretoData = paradas.map(p => {
    acumulado += Number(p.total_minutos);
    return {
      motivo: p.motivo_nombre,
      minutos: Number(p.total_minutos),
      porcentaje: totalMinutosParada > 0
        ? Math.round((acumulado / totalMinutosParada) * 100)
        : 0,
    };
  });

  const tickStyle = { fill: 'var(--col-text-muted)', fontSize: 11, fontWeight: 700 };

  return (
    <div className="slide-general">
      {fallbackMonth && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <span
            style={{
              background: 'var(--col-warn)',
              color: '#1a1a2e',
              fontSize: '9px',
              fontWeight: 900,
              padding: '3px 14px',
              borderRadius: '0 0 6px 6px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚡ DATOS DE MES ANTERIOR — MES ACTUAL SIN REGISTROS
          </span>
        </div>
      )}

      <div className="slide-general__kpis">
        <TechKpi
          label={isMonthly ? 'METROS MENSUALES' : 'METROS PRODUCIDOS'}
          value={totalMetros.toLocaleString()}
          unit="m"
          variant="primary"
        />
        <TechKpi
          label="TIEMPO EN PARADA"
          value={totalMinutosParada.toLocaleString()}
          unit="min"
          variant="neutral"
        />
        <TechKpi
          label="DESPERDICIO"
          value={Number(desperdicio.total_kg).toFixed(1)}
          unit="kg"
          variant="primary"
        />
      </div>

      <section className="tv-panel-clean slide-general__chart">
        {maquina && (
          <div className="tv-unit-badge">UNIDAD: {maquina}</div>
        )}

        <header className="slide-general__chart-header">
          <h2>{isMonthly ? 'PARADAS MENSUAL' : 'PARADAS'}</h2>
        </header>

        <div className="slide-general__chart-body">
          {paretoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={paretoData}
                margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--col-chart-grid)" />
                <XAxis dataKey="motivo" hide />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={tickStyle} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={tickStyle}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--col-surface-md)',
                    border: '1px solid var(--col-border)',
                    borderRadius: 4,
                  }}
                  itemStyle={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="minutos"
                  fill="var(--col-brand)"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  isAnimationActive={false}
                >
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>

              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--col-text-muted)',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                SIN PARADAS REGISTRADAS
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
