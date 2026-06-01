import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Wifi, ShieldAlert } from 'lucide-react';

export default function SlidePendingConfiguration() {
  const tvUid = localStorage.getItem('tv_uid') || 'TV-PENDIENTE';

  // Animaciones premium para el radar/giras
  const pulseVariants = {
    animate: {
      scale: [1, 1.08, 1],
      opacity: [0.3, 0.7, 0.3],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const ringVariants = {
    animate: (custom) => ({
      scale: [1, 2.2],
      opacity: [0.8, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        delay: custom * 1,
        ease: "easeOut"
      }
    })
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: '32px',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      padding: '16px'
    }}>
      {/* Columna Izquierda: Animación de Radar y Estado */}
      <div className="glass" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Anillos de ondas expansivas */}
        <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              custom={i}
              variants={ringVariants}
              animate="animate"
              style={{
                position: 'absolute',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '2px solid var(--col-brand)',
                boxShadow: '0 0 20px var(--col-brand-glow)',
                pointerEvents: 'none'
              }}
            />
          ))}

          {/* Círculo central con ícono y glow */}
          <motion.div
            variants={pulseVariants}
            animate="animate"
            style={{
              position: 'absolute',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--col-brand) 0%, rgba(249, 115, 22, 0.4) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px var(--col-brand-glow)',
              zIndex: 2
            }}
          >
            <Monitor size={48} color="#ffffff" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Textos Informativos */}
        <div style={{ textAlign: 'center', marginTop: '36px', zIndex: 3 }}>
          <h3 style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--col-text-primary)'
          }}>
            Esperando Vinculación
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--col-text-secondary)',
            marginTop: '8px',
            fontWeight: 600,
            maxWidth: '380px',
            margin: '8px auto 0',
            lineHeight: 1.5
          }}>
            Este terminal se encuentra conectado pero aún no tiene una máquina asignada para su visualización.
          </p>
        </div>

        {/* Línea de escaneo futurista */}
        <motion.div
          animate={{ y: [-150, 150] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--col-brand), transparent)',
            opacity: 0.25,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Columna Derecha: Tarjeta de Configuración con UID */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%'
      }}>
        {/* Tarjeta de Identificación */}
        <div className="glass-brand" style={{
          padding: '28px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Cpu size={24} />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Identificador del Nodo
            </span>
          </div>

          <h4 style={{
            fontSize: '11px',
            color: 'var(--col-on-brand-muted)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px'
          }}>
            UID del Dispositivo
          </h4>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '12px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.12em',
            textAlign: 'center',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
            marginBottom: '20px'
          }}>
            {tvUid}
          </div>

          <p style={{
            fontSize: '12px',
            color: 'var(--col-on-brand-muted)',
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            Proporcioná este identificador al administrador del sistema para vincular este terminal a una máquina de producción específica.
          </p>
        </div>

        {/* Tarjeta de Instrucciones rápidas */}
        <div className="glass" style={{
          padding: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: 'var(--col-brand-dim)',
            border: '1px solid var(--col-brand-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} color="var(--col-brand)" />
          </div>
          <div>
            <h5 style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--col-text-primary)'
            }}>
              Paso a seguir
            </h5>
            <p style={{
              fontSize: '11px',
              color: 'var(--col-text-secondary)',
              marginTop: '4px',
              lineHeight: 1.4
            }}>
              Ingresá al panel web de administración, seleccioná esta TV con su UID y asignale la máquina correspondiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
