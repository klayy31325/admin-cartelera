/**
 * Configuración centralizada de la API para la Cartelera (TV Display).
 * Detecta automáticamente el hostname para evitar cambios manuales de IP.
 */

const getApiBaseUrl = () => {
    // Si estamos en desarrollo y hay una variable de entorno, la usamos
    if (import.meta.env.VITE_API_URL && import.meta.env.MODE === 'development') {
        return import.meta.env.VITE_API_URL;
    }

    // Por defecto, usamos el hostname actual con el puerto del backend (8000)
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        return `http://${hostname}:8000`;
    }

    return "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();
