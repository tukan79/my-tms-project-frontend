// src/services/api.js
import axios from 'axios';

// --- Base URL ---
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Dynamic credentials: false for DEV (to avoid CORS issues), true for PROD
const useCredentials = !import.meta.env.DEV;


const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: useCredentials,   // 👈 TUTAJ
});

// === REQUEST INTERCEPTOR ===
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => { throw err; }
);

// === TOKEN REFRESH LOGIC ===
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// === RESPONSE INTERCEPTOR ===
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.config?.url);
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || '';

    if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      // Ciche wyjście dla anulowanych żądań (np. przy szybkich refreshach)
      throw error;
    }

    if (!originalRequest) throw error;

    const isAuthMeEndpoint = requestUrl.includes('/api/auth/me');
    const isLoginEndpoint = requestUrl.includes('/api/auth/login');

    if (isLoginEndpoint) {
      console.log("❌ Login failed, not retrying.");
      throw error;
    }

    if (requestUrl.includes('/api/auth/refresh')) {
      console.log('❌ Refresh endpoint failed:', status);
      throw error;
    }

    // === 401 → TRY REFRESH TOKEN ===
    if (status === 401 && !originalRequest._retry && !isAuthMeEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => { throw err; });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Refreshing token...');

        const refreshResponse = await axios.post(
          `${baseURL}/api/auth/refresh`,
          {},
          { withCredentials: useCredentials } // 👈 Używamy dynamicznego credentials
        );

        const newToken = refreshResponse?.data?.accessToken;
        if (!newToken) throw new Error('No new token from refresh');

        localStorage.setItem('token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        globalThis.dispatchEvent(
          new CustomEvent('token-refreshed', { detail: { accessToken: newToken } })
        );

        processQueue(null, newToken);
        console.log('✅ Token refreshed.');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh failed:', refreshError);
        processQueue(refreshError, null);

        localStorage.removeItem('token');
        globalThis.dispatchEvent(new Event('auth-error'));
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    console.log('❌ Response error:', status || 'No Status', requestUrl);
    console.log('❌ Error details:', error.response?.data || error.message);

    throw error;
  }
);

export default api;
