/**
 * api-config.ts
 * Centraliza la URL de la API para evitar hardcodear IPs.
 * Detecta automáticamente el host si estamos en el navegador.
 */

const getBaseUrl = () => {
  // 1. Si hay una variable de entorno, tiene prioridad
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Si estamos en el navegador, detectamos la IP/Host actual
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // El servidor API corre en el puerto 8000
    return `http://${hostname}:8000`;
  }

  // 3. Fallback para Server Side Rendering (SSR)
  return "http://localhost:8000";
};

export const API_URL = getBaseUrl();
export const API_BASE_URL = `${API_URL}/api`;

console.log("🚀 API Configured to:", API_BASE_URL);
