import axios from 'axios';

// Używamy zmiennej środowiskowej VITE_API_BASE_URL, która zostanie ustawiona w panelu Vercel dla środowiska produkcyjnego.
// Jeśli zmienna nie jest dostępna (np. podczas lokalnego rozwoju), używamy domyślnego adresu API.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Dodajemy "interceptor", który będzie przechwytywał każde zapytanie
// i dodawał do niego nagłówek autoryzacyjny z tokenem.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    console.log('🔄 Interceptor - Token found:', !!token);
    console.log('🔗 Making request to:', config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to headers');
    } else {
      console.log('❌ No token found in storage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received for:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data);
    // Jeśli serwer odpowie statusem 401 lub 403, oznacza to problem z autoryzacją.
    if (error.response && [401, 403].includes(error.response.status)) {
      // Zamiast twardego przekierowania, emitujemy niestandardowy event.
      // Aplikacja (np. AuthProvider) będzie mogła na niego zareagować.
      if (!window.location.pathname.endsWith('/login')) {
        window.dispatchEvent(new Event('auth-error'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
