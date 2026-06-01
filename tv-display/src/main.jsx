import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './components/Dashboard';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registrar PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión disponible. ¿Recargar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
