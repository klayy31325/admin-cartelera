import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 14
    }
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.97,
    transition: { duration: 0.2 }
  }
};

export default function SlideInfo({ data, isLoading }) {
  const [currentPage, setCurrentPage] = useState(0);

  const announcements = Array.isArray(data) ? data : [];

  // Reducimos el tamaño de página a 4 para dar más espacio a las fuentes y evitar desbordes
  const PAGE_SIZE = 3;
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
    }, 10000); // Cambia de página cada 6 segundos
    return () => clearInterval(interval);
  }, [pageCount]);

  if (isLoading) return <LoadingState />;

  if (announcements.length === 0) return <EmptyState />;

  const currentAnnouncements = pages[currentPage] || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
      {/* Contenedor con transición animada escalonada */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {currentAnnouncements.map((info) => (
              <InfoCard key={info.id} info={info} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Paginador (Puntos indicadores más grandes) */}
      {pageCount > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          paddingTop: 8,
          zIndex: 10
        }}>
          {Array.from({ length: pageCount }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentPage ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: idx === currentPage ? 'var(--col-brand)' : 'var(--col-border-lg)',
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
  const isMediumPriority = info.prioridad?.toLowerCase() === 'media';

  const getIcon = () => {
    switch (info.prioridad?.toLowerCase()) {
      case 'alta': return AlertTriangle;
      case 'media': return Info;
      default: return Bell;
    }
  };

  const Icon = getIcon();

  // Color de borde de la izquierda según prioridad
  const borderLeftColor = isHighPriority
    ? '#ef4444' // Rojo sólido
    : isMediumPriority
      ? '#f59e0b' // Amarillo/Naranja sólido
      : 'var(--col-border-lg)'; // Borde estándar del tema

  // Fondo del banner
  const cardBackground = isHighPriority
    ? 'var(--col-brand)' // Naranja sólido de la marca para llamar la atención en altas
    : 'var(--col-surface-md)'; // Color dinámico del tema para normales

  // Color del texto de contenido
  const bodyTextColor = isHighPriority
    ? 'rgba(255, 255, 255, 0.95)' // Blanco en alta prioridad
    : 'var(--col-text-secondary)'; // Texto dinámico contrastado en normales

  // Color del texto de título
  const titleTextColor = isHighPriority
    ? '#ffffff'
    : 'var(--col-text-primary)';

  // Color de los textos muted
  const mutedTextColor = isHighPriority
    ? 'rgba(255, 255, 255, 0.75)'
    : 'var(--col-text-muted)';

  return (
    <motion.div
      variants={itemVariants}
      style={{
        background: cardBackground,
        padding: '16px 22px',
        borderRadius: 16,
        border: '1px solid var(--col-border)',
        borderLeft: `6px solid ${borderLeftColor}`,
        boxShadow: isHighPriority
          ? '0 6px 20px rgba(249, 115, 22, 0.22)'
          : '0 4px 14px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '82px',
        transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Icono de estado */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: isHighPriority ? 'rgba(255, 255, 255, 0.18)' : 'var(--col-gauge-track)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isHighPriority ? '#ffffff' : 'var(--col-brand)',
          flexShrink: 0,
        }}
      >
        <Icon size={20} strokeWidth={2.5} />
      </div>

      {/* Fecha de Publicación */}
      <div style={{ minWidth: 90, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <Calendar size={12} color={isHighPriority ? '#ffffff' : 'var(--col-brand)'} />
          <span
            style={{
              fontSize: '9px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: mutedTextColor,
            }}
          >
            FECHA
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: titleTextColor,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {new Date(info.fecha_publicacion).toLocaleDateString()}
        </div>
      </div>

      {/* Título y Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: titleTextColor,
            textTransform: 'uppercase',
            lineHeight: 1.25,
            marginBottom: 4,
            margin: '0 0 4px 0',
          }}
        >
          {info.titulo}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: bodyTextColor,
            fontWeight: 500,
            lineHeight: 1.35,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {info.contenido}
        </p>
      </div>

      {/* Chip de Prioridad */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 100, justifyContent: 'flex-end', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: isHighPriority ? 'rgba(255, 255, 255, 0.15)' : 'var(--col-gauge-track)',
            border: isHighPriority ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--col-border)',
            color: isHighPriority ? '#ffffff' : 'var(--col-text-primary)',
          }}
        >
          <AlertTriangle size={11} color={isHighPriority ? '#ffffff' : borderLeftColor} />
          <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {info.prioridad || 'NORMAL'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingState = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <div style={{ width: 36, height: 36, border: '3px solid var(--col-border)', borderTopColor: 'var(--col-brand)', borderRadius: '50%' }} className="animate-spin" />
    <p style={{ color: 'var(--col-text-muted)', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Cargando Comunicados...</p>
  </div>
);

const EmptyState = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <div style={{ padding: 24, background: 'var(--col-brand-dim)', borderRadius: '50%', border: '1px solid var(--col-brand-glow)' }}>
      <Bell size={48} color="var(--col-brand)" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--col-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sin comunicados</h3>
      <p style={{ color: 'var(--col-text-muted)', fontWeight: 600, fontSize: '13px', marginTop: 6 }}>No hay información activa en este momento.</p>
    </div>
  </div>
);
