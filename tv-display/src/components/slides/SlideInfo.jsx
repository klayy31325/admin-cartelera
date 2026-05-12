import React from 'react';
import { motion } from 'framer-motion';

export default function SlideInfo({ data, isLoading }) {
  if (isLoading) return <div className="loading">Cargando información...</div>;
  
  const announcements = Array.isArray(data) ? data : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: 12, 
          background: 'var(--col-brand)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px var(--col-brand-alpha)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Información <span style={{ color: 'var(--col-brand)' }}>Diaria</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--col-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Comunicados oficiales y alertas de planta
          </p>
        </div>
      </header>

      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: announcements.length > 1 ? 'repeat(2, 1fr)' : '1fr', 
        gap: 20,
        overflow: 'hidden'
      }}>
        {announcements.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px dashed var(--col-border)',
            borderRadius: 24,
            color: 'var(--col-text-muted)'
          }}>
            <p style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>No hay comunicados activos</p>
          </div>
        ) : (
          announcements.slice(0, 4).map((info, idx) => (
            <motion.div
              key={info.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                background: 'var(--col-card-bg)',
                border: '1px solid var(--col-border)',
                borderRadius: 24,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Priority Indicator */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '8px 16px',
                background: info.prioridad === 'alta' ? '#ef4444' : info.prioridad === 'media' ? 'var(--col-brand)' : 'var(--col-border)',
                color: info.prioridad === 'alta' ? 'white' : 'black',
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                borderBottomLeftRadius: 16,
                letterSpacing: '0.1em'
              }}>
                Prioridad {info.prioridad}
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--col-text)', lineHeight: 1.2 }}>
                {info.titulo}
              </h3>
              
              <p style={{ 
                fontSize: '16px', 
                color: 'var(--col-text-secondary)', 
                lineHeight: 1.6,
                flex: 1,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical'
              }}>
                {info.contenido}
              </p>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid var(--col-border)'
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--col-text-muted)', textTransform: 'uppercase' }}>
                  Publicado: {new Date(info.fecha_publicacion).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--col-brand)' }} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--col-brand)', opacity: 0.5 }} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--col-brand)', opacity: 0.2 }} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
