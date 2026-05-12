import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, Legend
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import { AlertTriangle } from 'lucide-react';

/* Accessible, colorblind-safe palette with brand orange as primary */
const PALETTE = [
  '#f97316', '#38bdf8', '#a78bfa', '#34d399',
  '#fb923c', '#f472b6', '#facc15', '#94a3b8',
];

/* Custom accessible tooltip */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="glass-md" style={{ padding: '8px 14px' }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--col-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{name}</p>
      <p className="stat-number" style={{ fontSize: 'var(--text-lg)', color: 'var(--col-text-primary)' }}>
        {value} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--col-text-muted)' }}>min</span>
      </p>
    </div>
  );
}

/* Skeleton shimmer */
function ChartSkeleton() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{
        width: 200, height: 200, borderRadius: '50%',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

export default function ProductionChart({ data, isLoading }) {
  const [chartData, setChartData] = useState(data || []);
  const { lastEvent } = useSocket();

  /* Animate on real-time WS update */
  useEffect(() => {
    if (lastEvent?.type === 'parada-update' && lastEvent.data) {
      setChartData(lastEvent.data);
    }
  }, [lastEvent]);

  useEffect(() => {
    if (data) setChartData(data);
  }, [data]);

  const hasData = chartData.length > 0;

  return (
    <section
      className="glass"
      style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
      aria-label="Gráfico de distribución de paradas por motivo"
    >
      <header style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--col-brand)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
          HOY
        </p>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--col-text-primary)', marginTop: 2 }}>
          Motivos de Parada
        </h2>
        {/* Accessible text summary for screen readers */}
        <p className="visually-hidden" aria-live="polite">
          {hasData
            ? `${chartData.length} motivos registrados. El mayor es ${chartData[0]?.motivo} con ${chartData[0]?.total_minutos} minutos.`
            : 'Sin paradas registradas hoy.'}
        </p>
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        {isLoading ? <ChartSkeleton /> :
          !hasData ? (
            <EmptyState icon={AlertTriangle} message="Sin paradas registradas hoy" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="70%"
                  paddingAngle={4}
                  dataKey="total_minutos"
                  nameKey="motivo"
                  animationBegin={0}
                  animationDuration={600}
                  animationEasing="ease-out"
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PALETTE[i % PALETTE.length]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--col-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {val}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )
        }
      </div>
    </section>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
      <Icon size={32} color="var(--col-text-muted)" aria-hidden="true" />
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--col-text-muted)', fontWeight: 600 }}>{message}</p>
    </div>
  );
}
