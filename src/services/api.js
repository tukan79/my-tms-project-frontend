import axios from 'axios';

// Używamy zmiennej środowiskowej VITE_API_BASE_URL, która zostanie ustawiona w panelu Vercel dla środowiska produkcyjnego.
// Jeśli zmienna nie jest dostępna (np. podczas lokalnego rozwoju), używamy domyślnego adresu API.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://my-tms-project-production.up.railway.app';

console.log('🔗 API Base URL:', API_BASE_URL);

// Utwórz instancję axios z bazowym URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor do automatycznego dodawania tokena
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
