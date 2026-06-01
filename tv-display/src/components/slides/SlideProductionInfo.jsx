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

const SlideProductionInfo = ({ data = [], isLoading, maquina, maquina_id }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFocusIdx, setActiveFocusIdx] = useState(0);
  const queryClient = useQueryClient();

  if (isLoading) return <LoadingState />;

  // 1. Filtrar por máquina si se proporciona el ID
  const todayItems = maquina_id
    ? data.filter(item => Number(item.maquina_id) === Number(maquina_id))
    : data;

  if (todayItems.length === 0) return <EmptyState maquina={maquina} />;

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
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está enfocado en campos de texto de login
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const currentItemsCount = currentItems.length;
      if (currentItemsCount === 0) return;

      const isDown = e.key === 'ArrowDown' || e.keyCode === 40;
      const isUp = e.key === 'ArrowUp' || e.keyCode === 38;
      const isAction = e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Enter' || e.key === ' ' ||
                       e.keyCode === 39 || e.keyCode === 37 || e.keyCode === 13 || e.keyCode === 32;

      if (isDown) {
        if (activeFocusIdx < currentItemsCount - 1) {
          e.stopPropagation();
          e.preventDefault();
          setActiveFocusIdx(activeFocusIdx + 1);
        } else {
          // Último elemento de la página actual
          if (currentPage < pageCount - 1) {
            e.stopPropagation();
            e.preventDefault();
            setCurrentPage(currentPage + 1);
            setActiveFocusIdx(0);
          }
          // Si estamos en el último item de la última página, permitimos propagación al Dashboard
        }
      } else if (isUp) {
        if (activeFocusIdx > 0) {
          e.stopPropagation();
          e.preventDefault();
          setActiveFocusIdx(activeFocusIdx - 1);
        } else {
          // Primer elemento de la página actual
          if (currentPage > 0) {
            e.stopPropagation();
            e.preventDefault();
            setCurrentPage(currentPage - 1);
            setActiveFocusIdx(PAGE_SIZE - 1);
          }
          // Si estamos en el primer item de la primera página, permitimos propagación al Dashboard para retroceder
        }
      } else if (isAction) {
        const activeItem = currentItems[activeFocusIdx];
        if (activeItem) {
          e.stopPropagation();
          e.preventDefault();
          handleStatusToggle(activeItem);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [activeFocusIdx, currentPage, pageCount, currentItems]);

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
              const isFocused = idx === activeFocusIdx;
              return (
                <TaskCard 
                  key={item.id} 
                  item={item} 
                  index={globalIndex} 
                  isFocused={isFocused}
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

  return (
    <div
      style={{
        background: isCompletado
          ? 'rgba(255,255,255,0.015)'
          : isHighPriority
            ? 'var(--col-brand)'
            : 'var(--col-glass)',
        padding: '10px 18px',
        borderRadius: 12,
        border: isFocused 
          ? '2px solid var(--col-brand)' 
          : isHighPriority && !isCompletado 
            ? 'none' 
            : '1px solid var(--col-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isFocused
          ? '0 0 15px var(--col-brand-glow)'
          : 'none',
        opacity: isCompletado ? 0.4 : 1,
        filter: isCompletado ? 'grayscale(0.9)' : 'none',
        minHeight: '64px',
        transform: isFocused ? 'scale(1.012)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Indicador Numérico */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: isHighPriority && !isCompletado ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 900,
        color: isHighPriority && !isCompletado ? 'black' : 'var(--col-brand)',
        flexShrink: 0
      }}>
        {index + 1}
      </div>

      {/* Tarea Principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: '8px',
            fontWeight: 900,
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-block',
            background: isHighPriority && !isCompletado
              ? 'rgba(0, 0, 0, 0.15)'
              : item.prioridad === 'alta'
                ? 'rgba(239, 68, 68, 0.15)'
                : item.prioridad === 'media'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
            color: isHighPriority && !isCompletado
              ? 'rgba(0, 0, 0, 0.85)'
              : item.prioridad === 'alta'
                ? '#ef4444'
                : item.prioridad === 'media'
                  ? '#f59e0b'
                  : '#3b82f6',
            border: isHighPriority && !isCompletado
              ? '1px solid rgba(0, 0, 0, 0.2)'
              : item.prioridad === 'alta'
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : item.prioridad === 'media'
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            Prioridad: {item.prioridad || 'baja'}
          </span>
        </div>
        <h3 style={{
          fontSize: item.tarea.length > 100 ? '11px' : item.tarea.length > 50 ? '12px' : '13px',
          fontWeight: 900,
          color: isHighPriority && !isCompletado ? 'black' : 'var(--col-text)',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {item.tarea}
        </h3>
        {item.descripcion_secundaria && (
          <p style={{
            fontSize: item.descripcion_secundaria.length > 100 ? '9px' : '11px',
            fontWeight: 600,
            color: isHighPriority && !isCompletado ? 'rgba(0,0,0,0.7)' : 'var(--col-text-muted)',
            marginTop: 4,
            lineHeight: 1.3,
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {item.descripcion_secundaria}
          </p>
        )}
      </div>

      {/* Meta y Estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {item.meta_valor && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isHighPriority && !isCompletado ? 'rgba(255,255,255,0.2)' : 'rgba(184, 115, 51, 0.04)',
            padding: '6px 12px',
            borderRadius: 8,
            border: isHighPriority && !isCompletado ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(184, 115, 51, 0.08)'
          }}>
            <Target size={11} color={isHighPriority && !isCompletado ? 'black' : 'var(--col-brand)'} />
            <span style={{
              fontSize: '11px',
              fontWeight: 900,
              color: isHighPriority && !isCompletado ? 'black' : 'var(--col-text)'
            }}>
              {item.meta_valor}
            </span>
          </div>
        )}

        <div style={{ minWidth: 80 }}>
          <StatusBadge 
            status={item.estado} 
            dark={isHighPriority && !isCompletado} 
            isFocused={isFocused}
            onClick={onStatusClick}
          />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status, dark, isFocused, onClick }) => {
  const configs = {
    pendiente: { label: 'PENDIENTE', icon: Clock, color: 'var(--col-text-muted)' },
    en_progreso: { label: 'EN PROGRESO', icon: Loader2, color: dark ? 'black' : 'var(--col-brand)' },
    completado: { label: 'COMPLETADO', icon: CheckCircle2, color: '#10b981' }
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
      aria-label={`Cambiar estado actual: ${config.label}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        color: dark ? 'black' : config.color,
        opacity: dark ? 0.9 : 1,
        cursor: 'pointer',
        background: isFocused
          ? 'rgba(255,255,255,0.12)'
          : dark 
            ? 'rgba(0,0,0,0.06)' 
            : 'rgba(255,255,255,0.02)',
        padding: '6px 10px',
        borderRadius: 6,
        border: isFocused 
          ? '1px solid var(--col-brand)' 
          : `1px solid ${dark ? 'rgba(0,0,0,0.1)' : 'var(--col-border)'}`,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.03)';
        e.currentTarget.style.background = dark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
        if (!dark) e.currentTarget.style.borderColor = 'var(--col-brand)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = dark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.02)';
        if (!dark) e.currentTarget.style.borderColor = 'var(--col-border)';
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

