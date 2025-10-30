import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Import the configured axios instance

const AuthContext = createContext(null);

// Dedykowany hak do używania kontekstu autoryzacji
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Dodajemy brakujący stan
  const hasVerified = React.useRef(false); // Ref to prevent double-execution in StrictMode

  useEffect(() => {
    const verifyToken = async () => {
      // In React's StrictMode, effects run twice in development.
      // This check prevents the verification API call from being made a second time.
      if (hasVerified.current) {
        return;
      }

      if (token) {
        try {
          // Wykonujemy zapytanie do backendu, aby zweryfikować token
          await api.get('/api/auth/verify');
          setIsAuthenticated(true);
          hasVerified.current = true; // Oznaczamy, że weryfikacja została wykonana
        } catch (error) {
          console.error('Token verification failed:', error);
          logout(); // Wyloguj, jeśli token jest nieprawidłowy
        }
      } else {
        hasVerified.current = true; // Jeśli nie ma tokenu, oznaczamy jako zweryfikowane (brak tokenu)
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]); // Dependency array is correct

  // Nasłuchuj na globalny event błędu autoryzacji z interceptora
  useEffect(() => {
    const handleAuthError = () => {
      console.log('Auth error detected, logging out.');
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []); // Pusta tablica zależności, aby hook uruchomił się tylko raz

  const login = async (email, password) => {
    setLoading(true);
    console.log('🔐 Attempting login to:', import.meta.env.VITE_API_BASE_URL);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      console.log('✅ Login response:', response.data);

      // Ekstrakcja tokena - sprawdź strukturę odpowiedzi
      const token = response.data.token || // KLUCZOWE: Zapisz token do localStorage
                    response.data.accessToken ||
                    response.data.access_token;

      console.log('🔑 Extracted token:', token ? 'YES' : 'NO');

      if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Token saved:', token.substring(0, 20) + '...');

        // Potwierdź zapisanie
        const savedToken = localStorage.getItem('token');
        console.log('💾 Token verification:', savedToken ? 'SUCCESS' : 'FAILED');

        // Ręczne ustawienie nagłówka nie jest konieczne, ponieważ interceptor to zrobi,
        // ale dodajemy dla pewności i zgodności z Twoją sugestią.
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const { user: newUser } = response.data;
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(token);
        setUser(newUser);
        setIsAuthenticated(true);
        return newUser;
      } else {
        console.error('❌ No token in response:', response.data);
      }
      throw new Error('No token found in login response');
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Rzucamy błąd dalej, aby formularz logowania mógł go obsłużyć
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    login,
    logout,
    register,
    isAuthenticated,
    loading,
    api,
  };

  // Do not render children until the initial loading (token verification) is complete.
  // This prevents rendering the app in a temporary unauthenticated state.
  return (
    <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
  );
};

export default AuthContext;