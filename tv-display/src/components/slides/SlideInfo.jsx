import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';

export default function SlideInfo({ data, isLoading }) {
  if (isLoading) return <div className="loading">Cargando información...</div>;
  
  const announcements = Array.isArray(data) ? data : [];
  
  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return { color: '#ef4444', icon: AlertTriangle, bg: 'rgba(239, 68, 68, 0.1)' };
      case 'media':
        return { color: 'var(--col-brand)', icon: Info, bg: 'rgba(249, 115, 22, 0.1)' };
      default:
        return { color: 'var(--col-text-muted)', icon: Bell, bg: 'var(--col-brand-dim)' };
    }
  };

  // Duplicar items para efecto de scroll infinito si hay suficientes
  const scrollItems = [...announcements, ...announcements];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header más compacto */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 950, 
            textTransform: 'uppercase', 
            letterSpacing: '-0.04em', 
            color: 'var(--col-text-primary)'
          }}>
            COMUNICADOS <span style={{ color: 'var(--col-brand)' }}>INTERNOS</span>
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--col-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Información de planta en tiempo real
          </p>
        </div>
        
        <div style={{ 
          padding: '8px 16px', 
          background: 'var(--col-surface-md)', 
          borderRadius: 8, 
          border: '1px solid var(--col-border-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Calendar size={14} color="var(--col-brand)" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--col-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
          </span>
        </div>
      </header>

      {/* Area de Scroll Continuo */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden',
        maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
      }}>
        {announcements.length === 0 ? (
          <div style={{ 
            height: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--col-text-muted)'
          }}>
            <Bell size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
            <p style={{ fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>Sin comunicados activos</p>
          </div>
        ) : (
          <motion.div
            animate={{ 
              y: [0, -((announcements.length * 160) + (announcements.length * 16))] // Ajustar según tamaño de tarjeta
            }}
            transition={{ 
              duration: announcements.length * 10, // 10 segundos por item aprox
              ease: "linear", 
              repeat: Infinity 
            }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 16,
              paddingTop: '20px'
            }}
          >
            {scrollItems.map((info, idx) => {
              const config = getPriorityConfig(info.prioridad);
              const Icon = config.icon;

              return (
                <div
                  key={`${info.id}-${idx}`}
                  style={{
                    background: 'var(--col-surface-md)',
                    border: `1px solid var(--col-border-lg)`,
                    borderLeft: `4px solid ${config.color}`,
                    borderRadius: '12px',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    minHeight: '140px'
                  }}
                >
                  <div style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 12, 
                    background: config.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} color={config.color} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 900, 
                        color: config.color, 
                        textTransform: 'uppercase',
                        background: config.bg,
                        padding: '2px 6px',
                        borderRadius: 3
                      }}>
                        {info.prioridad}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--col-text-muted)', fontWeight: 600 }}>
                        {new Date(info.fecha_publicacion).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: 900, 
                      color: 'var(--col-text-primary)', 
                      lineHeight: 1.2,
                      marginBottom: 4
                    }}>
                      {info.titulo}
                    </h3>
                    
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--col-text-secondary)', 
                      lineHeight: 1.3,
                      fontWeight: 500
                    }}>
                      {info.contenido}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
