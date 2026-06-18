import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('curex_token', data.data.token);
        localStorage.setItem('curex_user', JSON.stringify(data.data.usuario));
        onLoginSuccess();
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1115',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '400px',
          padding: '40px',
          background: '#1a1d23',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid #2d323a'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12', marginBottom: '8px' }}>CUREX DISPLAY</h1>
          <p style={{ color: '#8b949e', fontSize: '14px' }}>Inicie sesión para activar la cartelera</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#8b949e', textTransform: 'uppercase' }}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@curex.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f1115',
                border: '1px solid #2d323a',
                borderRadius: '6px',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#8b949e', textTransform: 'uppercase' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f1115',
                border: '1px solid #2d323a',
                borderRadius: '6px',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#8b949e' : '#f39c12',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'AUTENTICANDO...' : 'ACTIVAR CARTELERA'}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#484f58' }}>
          SISTEMA DE GESTIÓN INDUSTRIAL v1.0
        </div>
      </motion.div>
    </div>
  );
}
