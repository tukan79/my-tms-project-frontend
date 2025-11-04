// src/api.js
import axios from 'axios';

// Ustawienia globalne
axios.defaults.withCredentials = true;

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// === Token injection ===
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.debug('🔐 Request with token →', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Token refresh logic ===
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;

    // 🔁 Obsługa 401 i odświeżanie tokena
    if (isUnauthorized && !originalRequest._retry) {
      if (isRefreshing) {
        // Inne zapytania czekają w kolejce
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.info('🔄 Attempting token refresh...');
        const refreshUrl = `${baseURL}/auth/refresh`;
        const { data } = await axios.post(refreshUrl, {}, { withCredentials: true });

        const newToken = data.accessToken;
        if (!newToken) throw new Error('No token returned from refresh.');

        // 🔥 Aktualizujemy token
        localStorage.setItem('token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Powiadamiamy aplikację (np. AuthContext)
        window.dispatchEvent(new CustomEvent('token-refreshed', { detail: { accessToken: newToken } }));

        processQueue(null, newToken);
        console.info('✅ Token refreshed successfully.');

        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh token failed:', refreshError);
        processQueue(refreshError, null);

        // Wyczyść token i wywołaj globalny event
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-error'));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Jeśli 403 lub inne błędy autoryzacji → wyloguj
    if (error.response?.status === 403) {
      console.warn('🚫 Forbidden (403) → forcing logout');
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-error'));
    }

    return Promise.reject(error);
  }
);

export default api;
