import axios from 'axios';

// Utwórz instancję axios z bazowym URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
