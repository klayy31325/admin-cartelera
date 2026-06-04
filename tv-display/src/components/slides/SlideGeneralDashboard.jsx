import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['var(--col-brand)', 'var(--col-warn)', 'var(--col-danger)', 'var(--col-info)', 'var(--col-text-muted)'];

function DesperdicioCard({ label, pct, limit, rawValue, unit, isMonthly }) {
  const pctNum = Number(pct);
  const isOverLimit = pctNum > limit;
  const barPct = Math.min(pctNum, 100);
  const barColor = isOverLimit ? '#ef4444' : '#22c55e';
  const glowColor = isOverLimit ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';

  return (
    <div className="tv-kpi tv-kpi--neutral" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="tv-kpi__label">{label}</p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--col-text-muted)', marginTop: 0, letterSpacing: '0.05em' }}>
            (Límite de alerta: {limit}%)
          </p>
        </div>
        {isOverLimit && (
          <div style={{ color: '#ef4444', fontSize: '18px', lineHeight: 1, flexShrink: 0, marginTop: -2 }}>
            ⚠
          </div>
        )}
      </div>

      <p className="stat-number" style={{ fontSize: '34px', fontWeight: 900, color: 'var(--col-text-primary)', lineHeight: 1.1, margin: 0 }}>
        {pctNum.toFixed(2)}%
      </p>

      <div style={{
        width: '100%',
        height: 8,
        borderRadius: 4,
        background: 'var(--col-gauge-track)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${barPct}%`,
          height: '100%',
          borderRadius: 4,
          background: barColor,
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOverLimit ? `0 0 10px ${glowColor}` : 'none',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: isOverLimit ? '#ef4444' : '#22c55e', letterSpacing: '0.04em' }}>
          {isOverLimit ? `▲ Excede límite de ${limit}%` : `✓ Dentro del límite de ${limit}%`}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--col-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {rawValue} {unit}
        </span>
      </div>
    </div>
  );
}
return (
  <div className={`tv-kpi tv-kpi--${variant}`} style={{ display: 'flex', flexDirection: 'column' }}>
    <p className="tv-kpi__label">{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
      <p className="stat-number tv-kpi__value">{value}</p>
      <span className="tv-kpi__unit">{unit}</span>
    </div>
    {subtext && (
      <div style={{ fontSize: '16px', fontWeight: 900, opacity: 0.85, marginTop: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
        {subtext}
      </div>
    )}
  </div>
);


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
    ? data.breakdown_desperdicio.find(m => Number(m.maquina_id) === Number(maquina_id)) || { total_kg: 0, total_ml: 0, pct_kg_total: 0, total_produccion_kg: 0 }
    : data?.desperdicio ?? { total_kg: 0, total_ml: 0, pct_kg_total: 0, total_produccion_kg: 0 };

  const totalMetros = produccion.reduce((a, c) => a + Number(c.total_metros ?? 0), 0);
  const totalMinutosParada = paradas.reduce((a, c) => a + Number(c.total_minutos ?? 0), 0);

  const pctMl = totalMetros > 0 ? (Number(desperdicio.total_ml ?? 0) / totalMetros) * 100 : 0;
  const pctKgTotal = Number(desperdicio.pct_kg_total ?? 0);
  const totalProdKg = Number(desperdicio.total_produccion_kg ?? 0);

  const dataMonthLabel = dataMonth
    ? new Date(dataMonth + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    : null;

  const chartData = paradas.map(p => {
    return {
      motivo: p.motivo_nombre,
      minutos: Number(p.total_minutos),
      porcentaje: totalMinutosParada > 0
        ? Number(((Number(p.total_minutos) / totalMinutosParada) * 100).toFixed(1))
        : 0,
    };
  }).sort((a, b) => b.minutos - a.minutos);

  // Mini carousel state
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(chartData.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(0);
  }, [data, maquina_id]);

  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 3000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const pageData = chartData.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="slide-general">
      {fallbackMonth && (
        <div
          style={{
            position: 'absolute',
            top: -17,
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
          label={isMonthly ? 'DESPERDICIO MENSUAL (M/L)' : 'DESPERDICIO (M/L)'}
          value={pctMl}
          unit="%"
          variant="neutral"
          subtext={`${Number(desperdicio.total_ml ?? 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m/l`}
        />
        <TechKpi
          label={isMonthly ? 'DESPERDICIO MENSUAL KG' : 'DESPERDICIO'}
          value={pctKgTotal.toFixed(2)}
          unit="%"
          variant="neutral"
          subtext={`${Number(desperdicio.total_kg ?? 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG`}
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
          {chartData.length > 0 ? (
            <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="slide-general__chart-list"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}
                >
                  {pageData.map((entry, index) => {
                    const globalIndex = currentPage * ITEMS_PER_PAGE + index;
                    return (
                      <div key={entry.motivo} className="parada-row">
                        <div className="parada-row__info">
                          <span className="parada-row__name">{entry.motivo}</span>
                          <span className="parada-row__value">
                            {entry.porcentaje}%
                            <span className="parada-row__time">({entry.minutos} min)</span>
                          </span>
                        </div>
                        <div className="parada-row__bar-container">
                          <div
                            className="parada-row__bar-fill"
                            style={{
                              width: `${entry.porcentaje}%`,
                              backgroundColor: COLORS[globalIndex % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

              </AnimatePresence>

              {/* Indicators */}
              {totalPages > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 6,
                    zIndex: 10,
                  }}
                >
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: idx === currentPage ? 12 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: idx === currentPage ? 'var(--col-brand)' : 'var(--col-text-muted)',
                        opacity: idx === currentPage ? 1 : 0.4,
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
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
