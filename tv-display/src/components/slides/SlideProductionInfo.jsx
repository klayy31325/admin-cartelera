import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config/api-config';
import {
  ClipboardList,
  Target,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';

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

const SlideProductionInfo = ({ data, isLoading, maquina, maquina_id, isFocused, onExitFocus }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFocusIdx, setActiveFocusIdx] = useState(0);
  const queryClient = useQueryClient();

  const itemsArray = Array.isArray(data) ? data : [];

  // 1. Filtrar por máquina si se proporciona el ID
  const todayItems = maquina_id
    ? itemsArray.filter(item => Number(item.maquina_id) === Number(maquina_id))
    : itemsArray;

  // 2. Ordenar las tareas: Pendientes y En Progreso primero, Completadas siempre al final
  const sortedItems = [...todayItems].sort((a, b) => {
    if (a.estado === 'completado' && b.estado !== 'completado') return 1;
    if (a.estado !== 'completado' && b.estado === 'completado') return -1;
    return (a.orden || 0) - (b.orden || 0);
  });

  // 3. Dividir las tareas en páginas de máximo 4 items cada una (columna única)
  const PAGE_SIZE = 4;
  const pageCount = Math.ceil(sortedItems.length / PAGE_SIZE);

  const pages = [];
  for (let i = 0; i < sortedItems.length; i += PAGE_SIZE) {
    pages.push(sortedItems.slice(i, i + PAGE_SIZE));
  }

  // Reiniciar la página si cambia la cantidad de items
  useEffect(() => {
    setCurrentPage(0);
    setActiveFocusIdx(0);
  }, [sortedItems.length]);

  // Rotación automática robusta del sub-carrusel basada en el número total de páginas
  useEffect(() => {
    if (pageCount <= 1) {
      setCurrentPage(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pageCount);
    }, 6000); // Rotación cada 6 segundos
    return () => clearInterval(interval);
  }, [pageCount]);

  // Alinear el foco al primer elemento visible cuando cambia la página automáticamente
  useEffect(() => {
    setActiveFocusIdx(0);
  }, [currentPage]);

  const handleStatusToggle = async (item, e) => {
    if (e) e.stopPropagation();

    const estados = ['pendiente', 'en_progreso', 'completado'];
    const currentIndex = estados.indexOf(item.estado);
    const nextEstado = estados[(currentIndex + 1) % estados.length];

    try {
      const response = await fetch(`${API_BASE_URL}/api/produccion-informativa/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, estado: nextEstado })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (error) {
      console.error("Error al actualizar estado de la tarea táctil/teclado:", error);
    }
  };

  const currentItems = pages[currentPage] || [];

  // Manejo de navegación espacial con flechas físicas (captura de teclado del control remoto)
  useEffect(() => {
    if (!isFocused || todayItems.length === 0) return;

    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const currentItemsCount = currentItems.length;
      if (currentItemsCount === 0) return;

      const isDown = e.key === 'ArrowDown' || e.keyCode === 40;
      const isUp = e.key === 'ArrowUp' || e.keyCode === 38;
      const isEnter = e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32;

      if (isDown) {
        e.preventDefault();
        if (activeFocusIdx < currentItemsCount - 1) {
          setActiveFocusIdx(activeFocusIdx + 1);
        } else {
          if (currentPage < pageCount - 1) {
            setCurrentPage(currentPage + 1);
            setActiveFocusIdx(0);
          }
        }
      } else if (isUp) {
        e.preventDefault();
        if (activeFocusIdx > 0) {
          setActiveFocusIdx(activeFocusIdx - 1);
        } else {
          if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            setActiveFocusIdx(PAGE_SIZE - 1);
          } else {
            if (onExitFocus) onExitFocus('up');
          }
        }
      } else if (isEnter) {
        const activeItem = currentItems[activeFocusIdx];
        if (activeItem) {
          e.preventDefault();
          handleStatusToggle(activeItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, activeFocusIdx, currentPage, pageCount, currentItems, onExitFocus, todayItems.length]);

  if (isLoading) return <LoadingState />;

  if (todayItems.length === 0) return <EmptyState maquina={maquina} />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
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
            {(() => {
              const firstActiveId = sortedItems.find(it => it.estado !== 'completado')?.id;
              return currentItems.map((item, idx) => {
                const globalIndex = currentPage * PAGE_SIZE + idx;
                const isCardFocused = isFocused && idx === activeFocusIdx;
                return (
                  <TaskCard
                    key={item.id}
                    item={item}
                    index={globalIndex}
                    isFocused={isCardFocused}
                    isFirstActive={item.id === firstActiveId}
                    onStatusClick={(e) => handleStatusToggle(item, e)}
                  />
                );
              });
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Paginador */}
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
};

const TaskCard = ({ item, index, isFocused, isFirstActive, onStatusClick }) => {
  const isCompletado = item.estado === 'completado';

  const formattedFecha = (() => {
    if (!item.fecha_asignada) return 'SIN FECHA';
    const rawDate = String(item.fecha_asignada).split('T')[0];
    const [year, month, day] = rawDate.split('-');
    if (!year || !month || !day) return rawDate;
    return `${day}/${month}/${year}`;
  })();

  const borderLeftColor = isCompletado
    ? 'var(--col-border)'
    : isFirstActive
      ? 'var(--col-brand)'
      : 'var(--col-border-lg)';

  const cardBackground = isCompletado
    ? 'var(--col-surface)'
    : isFirstActive
      ? 'var(--col-brand-dim)'
      : 'var(--col-surface-md)';

  return (
    <motion.div
      variants={itemVariants}
      style={{
        background: cardBackground,
        padding: '16px 22px',
        borderRadius: 16,
        border: isFocused
          ? '2px solid var(--col-brand)'
          : '1px solid var(--col-border)',
        borderLeft: `6px solid ${isFocused ? 'var(--col-brand)' : borderLeftColor}`,
        boxShadow: isFocused
          ? '0 8px 24px var(--col-brand-glow)'
          : isFirstActive
            ? '0 4px 16px rgba(249, 115, 22, 0.12)'
            : '0 4px 14px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
        opacity: isCompletado ? 0.45 : 1,
        filter: isCompletado ? 'grayscale(0.8)' : 'none',
        minHeight: '82px',
        transform: isFocused ? 'scale(1.02)' : 'scale(1)',
        transition: 'border 0.2s, background 0.2s, box-shadow 0.2s, transform 0.2s',
      }}
    >
      {/* Fecha superior derecha */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 12,
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--col-text-muted)',
          opacity: 0.8,
        }}
      >
        {formattedFecha}
      </div>

      {/* Número de Orden */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: isFirstActive
            ? 'var(--col-brand)'
            : 'var(--col-gauge-track)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 900,
          color: isFirstActive ? '#ffffff' : 'var(--col-text-primary)',
          flexShrink: 0,
          boxShadow: isFirstActive ? '0 4px 12px var(--col-brand-glow)' : 'none',
        }}
      >
        {item.orden || '-'}
      </div>

      {/* Contenido de la Tarea */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--col-text-primary)',
            textTransform: 'uppercase',
            lineHeight: 1.25,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {item.tarea}
        </h3>
        {item.descripcion_secundaria && (
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--col-text-secondary)',
              marginTop: 4,
              lineHeight: 1.3,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: '4px 0 0',
            }}
          >
            {item.descripcion_secundaria}
          </p>
        )}
      </div>

      {/* Meta y Estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {item.meta_valor && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--col-brand-dim)',
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--col-brand-glow)',
            }}
          >
            <Target size={14} color={'var(--col-brand)'} />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: 'var(--col-text-primary)',
              }}
            >
              {item.meta_valor}
            </span>
          </div>
        )}

        <div style={{ minWidth: 110 }}>
          <StatusBadge
            status={item.estado}
            isFocused={isFocused}
            onClick={onStatusClick}
          />
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status, isFocused, onClick }) => {
  const configs = {
    pendiente: { label: 'PENDIENTE', icon: Clock, color: 'var(--col-brand)' },
    en_progreso: { label: 'EN PROGRESO', icon: Loader2, color: 'var(--col-brand)' },
    completado: { label: 'COMPLETADO', icon: CheckCircle2, color: '#10b981' },
  };

  const config = configs[status] || configs.pendiente;
  const Icon = config.icon;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        color: config.color,
        cursor: 'pointer',
        background: isFocused
          ? 'var(--col-brand-dim)'
          : 'var(--col-gauge-track)',
        padding: '8px 14px',
        borderRadius: 10,
        border: isFocused
          ? '2px solid var(--col-brand)'
          : `1px solid var(--col-border)`,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.03)';
        e.currentTarget.style.borderColor = 'var(--col-brand)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = isFocused ? 'var(--col-brand)' : 'var(--col-border)';
      }}
    >
      <Icon size={12} className={status === 'en_progreso' ? 'animate-spin' : ''} />
      <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {config.label}
      </span>
    </div>
  );
};

const LoadingState = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <div style={{ width: 36, height: 36, border: '3px solid var(--col-border)', borderTopColor: 'var(--col-brand)', borderRadius: '50%' }} className="animate-spin" />
    <p style={{ color: 'var(--col-text-muted)', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sincronizando Planificación...</p>
  </div>
);

const EmptyState = ({ maquina }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <div style={{ padding: 24, background: 'var(--col-brand-dim)', borderRadius: '50%', border: '1px solid var(--col-brand-glow)' }}>
      <ClipboardList size={48} color="var(--col-brand)" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--col-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sin tareas para hoy</h3>
      <p style={{ color: 'var(--col-text-muted)', fontWeight: 600, fontSize: '13px', marginTop: 6, maxWidth: '400px' }}>No se han asignado metas específicas para {maquina || 'la planta'} en este periodo.</p>
    </div>
  </div>
);

export default SlideProductionInfo;
