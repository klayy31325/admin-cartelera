import { motion } from 'framer-motion';
import { Award, Package, ChevronRight } from 'lucide-react';

const COLORS = ['var(--col-brand)', 'var(--col-warn)', 'var(--col-danger)', 'var(--col-info)', 'var(--col-text-muted)'];

export default function SlideTopProducts({ data, isLoading }) {
  const produccion = data?.produccion ?? [];
  const products = [...produccion].sort((a, b) => Number(b.total_metros) - Number(a.total_metros));
  const maxMetros = products[0]?.total_metros ?? 1;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 24, height: '100%' }}>
      <header className="slide-page__header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ padding: '20px', background: 'var(--col-brand-dim)', borderRadius: 4, flexShrink: 0 }}>
          <Award size={24} color="var(--col-brand)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1>RANKING DE PRODUCCIÓN DIARIA</h1>
          <p>MÉTRICAS POR UNIDAD OPERATIVA · FILTRO POR VOLUMEN</p>
        </div>
      </header>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, listStyle: 'none', height: '100%', overflow: 'hidden' }}>
        {products.length > 0 ? products.map((item, i) => {
          const pct = (Number(item.total_metros) / maxMetros) * 100;
          const color = COLORS[i % COLORS.length];
          return (
            <motion.li
              key={item.maquina_nombre}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={i === 0 ? "glass-brand" : "glass"}
              style={{
                padding: '20px 24px',
                flexShrink: 0,
                borderLeft: i === 0 ? 'none' : `4px solid ${color}`,
                border: i === 0 ? 'none' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span className="stat-number" style={{ fontSize: '24px', color: i === 0 ? 'var(--col-on-brand)' : color, opacity: i === 0 ? 1 : 0.8 }}>0{i + 1}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: i === 0 ? 'var(--col-on-brand)' : 'var(--col-text-primary)', letterSpacing: '0.02em' }}>{item.maquina_nombre}</h3>
                    <p style={{ fontSize: '10px', color: i === 0 ? 'var(--col-on-brand-muted)' : 'var(--col-text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      EFICIENCIA: {Math.round(Number(item.eficiencia_promedio))}% | PARADAS: {Math.round(Number(item.total_minutos))} MIN
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="stat-number" style={{ fontSize: '24px', color: i === 0 ? 'var(--col-on-brand)' : 'var(--col-text-primary)' }}>
                    {Number(item.total_metros).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '9px', color: i === 0 ? 'var(--col-on-brand-muted)' : 'var(--col-text-muted)', fontWeight: 800 }}>METROS TOTALES</p>
                </div>
              </div>
              <div style={{ width: '100%', height: 4, background: i === 0 ? 'var(--col-on-brand-track)' : 'var(--col-gauge-track)', borderRadius: 1 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.3 }}
                  style={{ height: '100%', background: i === 0 ? 'var(--col-on-brand-bar)' : color, boxShadow: i === 0 ? 'none' : `0 0 10px ${color}66` }}
                />
              </div>
            </motion.li>
          );
        }) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
            <Package size={48} color="var(--col-text-muted)" />
            <p style={{ marginTop: 16, fontSize: '12px', fontWeight: 800, color: 'var(--col-text-muted)', textTransform: 'uppercase' }}>No Data Available</p>
          </div>
        )}
      </ul>
    </div>
  );
}

