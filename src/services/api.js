// src/services/api.js
import axios from 'axios';

// --- Base URL ---
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:10000';
console.log("🔧 Loaded BASE URL =", baseURL);

// Global config
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// === REQUEST INTERCEPTOR ===
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const fullUrl = (config.baseURL || baseURL) + (config.url || '');
    console.log('🔐 Request full URL:', fullUrl);
    console.log('🔐 Sending request with token:', token ? 'YES' : 'NO');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Authorization header set');
    }
    return config;
  },
  (err) => Promise.reject(err)
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

    // no original request = nothing to fix
    if (!originalRequest) throw error;

    const isAuthMeEndpoint = requestUrl.includes('/api/auth/me');
    const isLoginEndpoint = requestUrl.includes('/api/auth/login');

    // Do NOT retry login errors
    if (isLoginEndpoint) {
      console.log("❌ Login failed, not retrying.");
      throw error;
    }

    // Do NOT retry refresh errors
    if (requestUrl.includes('/api/auth/refresh')) {
      console.log('❌ Refresh endpoint failed:', status);
      throw error;
    }

    // --- 401 → REFRESH TOKEN ---
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
          { withCredentials: true }
        );

        const newToken = refreshResponse?.data?.accessToken;
        if (!newToken) throw new Error('No new token from refresh');

        // save token
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

        return Promise.reject(refreshError);
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
