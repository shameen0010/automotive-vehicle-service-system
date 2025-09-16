import axios from 'axios';

// Prefer Vite proxy in dev; allow override via VITE_API_BASE
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  '';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth headers if needed
api.interceptors.request.use(
  (config) => {

    // console.debug('API Request:', config.method?.toUpperCase(), config.url);
    // console.debug('Request data:', config.data);

    // You can add any request modifications here if needed

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage on auth error
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Dispatch a custom event to notify the auth context
      window.dispatchEvent(new CustomEvent('auth-error', { detail: { status: 401 } }));
    }
    return Promise.reject(error);
  }
);

export default api;
