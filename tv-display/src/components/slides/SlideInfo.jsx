import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SlideInfo({ data, isLoading }) {
  const [currentPage, setCurrentPage] = useState(0);

  if (isLoading) return <LoadingState />;

  const announcements = Array.isArray(data) ? data : [];

  if (announcements.length === 0) return <EmptyState />;

  // Dividir los comunicados en páginas de máximo 4 items cada una (columna única)
  const PAGE_SIZE = 4;
  const pageCount = Math.ceil(announcements.length / PAGE_SIZE);

  const pages = [];
  for (let i = 0; i < announcements.length; i += PAGE_SIZE) {
    pages.push(announcements.slice(i, i + PAGE_SIZE));
  }

  // Rotación automática de páginas de comunicados
  useEffect(() => {
    setCurrentPage(0);
  }, [announcements.length]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pageCount);
    }, 6000); // Cambia de página cada 6 segundos
    return () => clearInterval(interval);
  }, [pageCount]);

  const currentAnnouncements = pages[currentPage] || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
      {/* Contenedor con transición suave de opacidad */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {currentAnnouncements.map((info) => (
              <InfoCard key={info.id} info={info} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Paginador (Puntos indicadores) */}
      {pageCount > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          paddingTop: 4,
          zIndex: 10
        }}>
          {Array.from({ length: pageCount }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentPage ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: idx === currentPage ? 'var(--col-brand)' : 'var(--col-border)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const InfoCard = ({ info }) => {
  const isHighPriority = info.prioridad?.toLowerCase() === 'alta';

  const getIcon = () => {
    switch (info.prioridad?.toLowerCase()) {
      case 'alta': return AlertTriangle;
      case 'media': return Info;
      default: return Bell;
    }
  };

  const Icon = getIcon();

  return (
    <div
      style={{
        background: isHighPriority ? 'var(--col-brand)' : 'var(--col-glass)',
        padding: '10px 18px',
        borderRadius: 12,
        border: isHighPriority ? 'none' : '1px solid var(--col-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHighPriority ? '0 6px 12px rgba(184, 115, 51, 0.08)' : 'none',
        minHeight: '64px'
      }}
    >
      {/* Icono */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: isHighPriority ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isHighPriority ? 'black' : 'var(--col-brand)',
        flexShrink: 0
      }}>
        <Icon size={14} />
      </div>

      {/* Metadata */}
      <div style={{ minWidth: 80 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 1
        }}>
          <Calendar size={10} color={isHighPriority ? 'rgba(0,0,0,0.5)' : 'var(--col-brand)'} />
          <span style={{
            fontSize: '8px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: isHighPriority ? 'rgba(0,0,0,0.6)' : 'var(--col-text-muted)'
          }}>
            FECHA
          </span>
        </div>
        <div style={{
          fontSize: '10px',
          fontWeight: 800,
          color: isHighPriority ? 'black' : 'var(--col-text)',
          textTransform: 'uppercase'
        }}>
          {new Date(info.fecha_publicacion).toLocaleDateString()}
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 900,
          color: isHighPriority ? 'black' : 'var(--col-text)',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          marginBottom: 1
        }}>
          {info.titulo}
        </h3>
        <p style={{
          fontSize: '11px',
          color: isHighPriority ? 'rgba(0,0,0,0.7)' : 'var(--col-text-muted)',
          fontWeight: 500,
          lineHeight: 1.3
        }}>
          {info.contenido}
        </p>
      </div>

      {/* Prioridad Badge */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: isHighPriority ? 'black' : 'var(--col-text-muted)'
        }}>
          <AlertTriangle size={10} />
          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {info.prioridad || 'NORMAL'}
          </span>
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <div style={{ width: 32, height: 32, border: '2px solid var(--col-border)', borderTopColor: 'var(--col-brand)', borderRadius: '50%' }} className="animate-spin" />
    <p style={{ color: 'var(--col-text-muted)', fontWeight: 800, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Cargando Comunicados...</p>
  </div>
);

const EmptyState = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
    <div style={{ padding: 18, background: 'var(--col-glass)', borderRadius: '50%', border: '1px solid var(--col-border)' }}>
      <Bell size={36} color="var(--col-border)" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--col-text)', textTransform: 'uppercase' }}>Sin comunicados</h3>
      <p style={{ color: 'var(--col-text-muted)', fontWeight: 600, fontSize: 11, marginTop: 4 }}>No hay información activa en este momento.</p>
    </div>
  </div>
);

