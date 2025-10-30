import axios from 'axios';

// Używamy zmiennej środowiskowej VITE_API_BASE_URL, która zostanie ustawiona w panelu Vercel dla środowiska produkcyjnego.
// Jeśli zmienna nie jest dostępna (np. podczas lokalnego rozwoju), używamy domyślnego adresu API.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Dodajemy "interceptor", który będzie przechwytywał każde zapytanie
// i dodawał do niego nagłówek autoryzacyjny z tokenem.
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
