import { motion } from 'framer-motion';
import { Award, Package, ChevronRight } from 'lucide-react';

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export default function SlideTopProducts({ data, isLoading }) {
  const produccion = data?.produccion ?? [];
  const products = [...produccion].sort((a, b) => Number(b.total_metros) - Number(a.total_metros));
  const maxMetros = products[0]?.total_metros ?? 1;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 24, height: '100%' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ padding: 12, background: 'var(--col-brand-dim)', borderRadius: 4 }}>
          <Award size={24} color="var(--col-brand)" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--col-text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            RANKING DE PRODUCCIÓN DIARIA
          </h1>
          <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            MÉTRICAS POR UNIDAD OPERATIVA · FILTRO POR VOLUMEN
          </p>
        </div>
      </header>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, listStyle: 'none' }}>
        {products.length > 0 ? products.map((item, i) => {
          const pct = (Number(item.total_metros) / maxMetros) * 100;
          const color = COLORS[i % COLORS.length];
          return (
            <motion.li
              key={item.maquina_nombre}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass"
              style={{ padding: '20px 24px', borderLeft: `4px solid ${color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span className="stat-number" style={{ fontSize: '24px', color: color, opacity: 0.8 }}>0{i + 1}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', letterSpacing: '0.02em' }}>{item.maquina_nombre}</h3>
                    <p style={{ fontSize: '10px', color: 'var(--col-text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      EFICIENCIA: {Math.round(Number(item.eficiencia_promedio))}% | PARADAS: {Math.round(Number(item.total_minutos))} MIN
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="stat-number" style={{ fontSize: '24px', color: 'white' }}>
                    {Number(item.total_metros).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '9px', color: 'var(--col-text-muted)', fontWeight: 800 }}>METROS TOTALES</p>
                </div>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.3 }}
                  style={{ height: '100%', background: color, boxShadow: `0 0 10px ${color}66` }}
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
