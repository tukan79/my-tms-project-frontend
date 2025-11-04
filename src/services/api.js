// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 👈 konieczne, żeby cookie refreshToken było wysyłane
});

// === Dodaj token do nagłówków ===
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('✅ Token added to request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Obsługa błędów 401 i odświeżania tokenu ===
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Czekamy na zakończenie odświeżania
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Refreshing token...');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true } // 👈 to klucz — cookie zostanie wysłane automatycznie
        );

        const newAccessToken = data.accessToken;
        localStorage.setItem('token', newAccessToken);

        console.log('✅ Token refreshed successfully.');

        processQueue(null, newAccessToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-error'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;