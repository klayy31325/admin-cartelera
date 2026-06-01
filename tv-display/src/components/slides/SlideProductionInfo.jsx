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
    // Criterio secundario: Prioridad alta primero
    if (a.prioridad === 'alta' && b.prioridad !== 'alta') return -1;
    if (a.prioridad !== 'alta' && b.prioridad === 'alta') return 1;
    return 0;
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
        // Actualizar la caché de React Query inmediatamente para que se vea reflejado en la UI
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
      // Ignorar si el usuario está enfocado en campos de texto de login
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
          // Último elemento de la página actual
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
          // Primer elemento de la página actual
          if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            setActiveFocusIdx(PAGE_SIZE - 1);
          } else {
            // Salir hacia arriba (TopBar)
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
            {currentItems.map((item, idx) => {
              // Calcular el índice real global para mostrar el orden numérico correcto
              const globalIndex = currentPage * PAGE_SIZE + idx;
              const isCardFocused = isFocused && idx === activeFocusIdx;
              return (
                <TaskCard 
                  key={item.id} 
                  item={item} 
                  index={globalIndex} 
                  isFocused={isCardFocused}
                  onStatusClick={(e) => handleStatusToggle(item, e)} 
                />
              );
            })}
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
};

const TaskCard = ({ item, index, isFocused, onStatusClick }) => {
  const isHighPriority = item.prioridad === 'alta';
  const isCompletado = item.estado === 'completado';

  const onOrange = isHighPriority && !isCompletado;
  const formattedFecha = (() => {
    if (!item.fecha_asignada) return 'SIN FECHA';
    const rawDate = String(item.fecha_asignada).split('T')[0];
    const [year, month, day] = rawDate.split('-');
    if (!year || !month || !day) return rawDate;
    return `${day}/${month}/${year}`;
  })();

  return (
    <div
      className={onOrange ? 'tv-priority-high' : undefined}
      style={{
        background: isCompletado
          ? 'rgba(255,255,255,0.015)'
          : isHighPriority
            ? 'var(--col-brand)'
            : 'var(--col-surface-md)',
        padding: '10px 18px',
        borderRadius: 12,
        border: isFocused
          ? '2px solid var(--col-brand)'
          : onOrange
            ? 'none'
            : '1px solid var(--col-border)',
        boxShadow: isFocused
          ? '0 0 20px var(--col-brand-glow)'
          : onOrange
            ? '0 4px 14px rgba(249, 115, 22, 0.25)'
            : '0 2px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        opacity: isCompletado ? 0.4 : 1,
        filter: isCompletado ? 'grayscale(0.9)' : 'none',
        minHeight: '64px',
        transform: isFocused ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 8,
          fontSize: '7px',
          fontWeight: 900,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          padding: '3px 22px',
          borderRadius: 6,

          zIndex: 2,
          color: onOrange ? '#ffffff' : 'var(--col-text-muted)',
        }}
        title={`Fecha asignada: ${formattedFecha}`}
      >
        {formattedFecha}
      </div>

      <div
        className={onOrange ? 'tv-priority-high__icon-box' : undefined}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: onOrange ? undefined : 'var(--col-gauge-track)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 900,
          color: onOrange ? undefined : 'var(--col-brand)',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      {/* Tarea Principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            className={onOrange ? 'tv-priority-high__chip' : undefined}
            style={{
              fontSize: '8px',
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-block',
              background: onOrange
                ? undefined
                : item.prioridad === 'alta'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : item.prioridad === 'media'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
              color: onOrange
                ? undefined
                : item.prioridad === 'alta'
                  ? '#ef4444'
                  : item.prioridad === 'media'
                    ? '#f59e0b'
                    : '#3b82f6',
              border: onOrange
                ? undefined
                : item.prioridad === 'alta'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : item.prioridad === 'media'
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            Prioridad: {item.prioridad || 'baja'}
          </span>
        </div>
        <h3
          className={onOrange ? 'tv-priority-high__title' : undefined}
          style={{
            fontSize: item.tarea.length > 100 ? '11px' : item.tarea.length > 50 ? '12px' : '13px',
            fontWeight: 900,
            color: onOrange ? undefined : 'var(--col-text-primary)',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.tarea}
        </h3>
        {item.descripcion_secundaria && (
          <p
            className={onOrange ? 'tv-priority-high__body' : undefined}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: onOrange ? undefined : 'var(--col-text-muted)',
              marginTop: 4,
              lineHeight: 1.3,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.descripcion_secundaria}
          </p>
        )}
      </div>

      {/* Meta y Estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {item.meta_valor && (
          <div
            className={onOrange ? 'tv-priority-high__meta' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: onOrange ? undefined : 'rgba(184, 115, 51, 0.04)',
              padding: '6px 12px',
              borderRadius: 8,
              border: onOrange ? undefined : '1px solid rgba(184, 115, 51, 0.08)',
            }}
          >
            <Target size={11} color={onOrange ? '#ffffff' : 'var(--col-brand)'} />
            <span
              className={onOrange ? 'tv-priority-high__title' : undefined}
              style={{
                fontSize: '11px',
                fontWeight: 900,
                color: onOrange ? undefined : 'var(--col-text-primary)',
              }}
            >
              {item.meta_valor}
            </span>
          </div>
        )}

        <div style={{ minWidth: 80 }}>
          <StatusBadge 
            status={item.estado} 
            onBrand={onOrange} 
            isFocused={isFocused}
            onClick={onStatusClick}
          />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status, onBrand, isFocused, onClick }) => {
  const configs = {
    pendiente: { label: 'PENDIENTE', icon: Clock, color: onBrand ? '#ffffff' : 'var(--col-text-muted)' },
    en_progreso: { label: 'EN PROGRESO', icon: Loader2, color: onBrand ? '#ffffff' : 'var(--col-brand)' },
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
      className={onBrand ? 'tv-priority-high__status' : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Cambiar estado actual: ${config.label}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        color: config.color,
        cursor: 'pointer',
        background: isFocused
          ? 'rgba(255, 255, 255, 0.28)'
          : onBrand
            ? 'rgba(255, 255, 255, 0.15)'
            : 'var(--col-gauge-track)',
        padding: '6px 10px',
        borderRadius: 6,
        border: isFocused
          ? '1px solid #ffffff'
          : `1px solid ${onBrand ? 'rgba(255, 255, 255, 0.28)' : 'var(--col-border)'}`,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.03)';
        e.currentTarget.style.background = onBrand ? 'rgba(255, 255, 255, 0.22)' : 'var(--col-gauge-track)';
        if (!onBrand) e.currentTarget.style.borderColor = 'var(--col-brand)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = onBrand ? 'rgba(255, 255, 255, 0.15)' : 'var(--col-gauge-track)';
        if (!onBrand) e.currentTarget.style.borderColor = 'var(--col-border)';
      }}
    >
      <Icon size={10} className={status === 'en_progreso' ? 'animate-spin' : ''} />
      <span style={{ fontSize: '7.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {config.label}
      </span>
    </div>
  );
};

const LoadingState = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
    <div style={{ width: 32, height: 32, border: '2px solid var(--col-border)', borderTopColor: 'var(--col-brand)', borderRadius: '50%' }} className="animate-spin" />
    <p style={{ color: 'var(--col-text-muted)', fontWeight: 800, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sincronizando Planificación...</p>
  </div>
);

const EmptyState = ({ maquina }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
    <div style={{ padding: 18, background: 'var(--col-glass)', borderRadius: '50%', border: '1px solid var(--col-border)' }}>
      <ClipboardList size={36} color="var(--col-border)" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--col-text)', textTransform: 'uppercase' }}>Sin tareas para hoy</h3>
      <p style={{ color: 'var(--col-text-muted)', fontWeight: 600, fontSize: 11, marginTop: 4 }}>No se han asignado metas específicas para {maquina || 'la planta'} en este periodo.</p>
    </div>
  </div>
);

export default SlideProductionInfo;

