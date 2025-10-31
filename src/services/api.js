import axios from 'axios';

// Używamy zmiennej środowiskowej, ale dodajemy twardy fallback do produkcyjnego URL.
// To zabezpiecza aplikację, jeśli zmienna VITE_API_BASE_URL nie jest ustawiona na Vercel.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://my-tms-project-production.up.railway.app';

// Utwórz instancję axios z bazowym URL
const api = axios.create({
  baseURL: baseURL,
});

// INTERCEPTOR - automatycznie dodaje token do WSZYSTKICH zapytań
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

export default api;
