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

// Dodajemy "interceptor", który będzie przechwytywał każde zapytanie
// i dodawał do niego nagłówek autoryzacyjny z tokenem.
// Interceptor do automatycznego dodawania tokena do WSZYSTKICH zapytań
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    console.log('🔄 Interceptor - Making request to:', config.url);
    console.log('🔑 Token found:', !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to headers for:', config.url);
    } else {
      console.log('❌ No token found for request:', config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor do obsługi odpowiedzi - szczególnie błędów 401
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received for:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.config?.url);

    // Jeśli serwer odpowie statusem 401 lub 403, oznacza to problem z autoryzacją.
    // Jeśli otrzymamy 401 Unauthorized, automatycznie wyloguj
    if (error.response && [401, 403].includes(error.response.status)) {
      console.log('🚪 401 Unauthorized - triggering logout');

      // Usuń token z localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Zamiast twardego przekierowania, emitujemy niestandardowy event.
      // Aplikacja (np. AuthProvider) będzie mogła na niego zareagować.
      // Wyślij globalny event żeby AuthContext się zaktualizował
      if (!window.location.pathname.endsWith('/login')) {
        window.dispatchEvent(new Event('auth-error'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
