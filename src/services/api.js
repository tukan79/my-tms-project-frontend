import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor do dodawania tokenu do każdego zapytania
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- NOWA SEKCJA: Interceptor do obsługi błędów 401 i odświeżania tokenu ---

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Sprawdzamy, czy błąd to 401 i czy nie jest to próba odświeżenia tokenu
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Jeśli token jest już odświeżany, dodajemy zapytanie do kolejki
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Jeśli nie ma refresh tokenu, wylogowujemy
        console.log('No refresh token, logging out.');
        // Możesz tu wywołać funkcję logout z AuthContext lub przekierować
        window.dispatchEvent(new Event('auth-error'));
        return Promise.reject(error);
      }

      try {
        console.log('🔄 Attempting to refresh token...');
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, { refreshToken });
        
        const newAccessToken = data.accessToken;
        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', data.refreshToken); // Backend może zwrócić nowy refresh token
        
        console.log('✅ Token refreshed successfully.');
        
        api.defaults.headers.common.Authorization = 'Bearer ' + newAccessToken;
        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        // Jeśli odświeżenie nie powiedzie się, wyloguj
        window.dispatchEvent(new CustomEvent('auth-error', { detail: refreshError }));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ostatnia zmiana (30.05.2024, 13:14:12)
