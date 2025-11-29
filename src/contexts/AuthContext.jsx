// frontend/src/contexts/AuthContext.jsx
import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import api from '@/services/api';
import { useToast } from '@/contexts/ToastContext.jsx';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Ładowanie podczas startu aplikacji
  const [isLoading, setIsLoading] = useState(true);

  // Ładowanie podczas logowania / rejestracji
  const [loading, setLoading] = useState(false);

  // Flaga zapobiegająca podwójnej inicjalizacji sesji po zalogowaniu.
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const { showToast } = useToast();

  // 🔹 Logowanie użytkownika
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data } = await api.post('/api/auth/login', { email, password });

        if (data?.accessToken) {
          localStorage.setItem('token', data.accessToken);
        }
 
        setUser(data?.user || null);
        setIsAuthenticated(true);
 
        // Ustawiamy flagę, aby pominąć `initializeAuth` w `useEffect`.
        setJustLoggedIn(true);
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [] // showToast z useToast jest stabilny, nie trzeba go dodawać.
  );

  // 🔹 Rejestracja
  const register = useCallback(
    async (userData) => {
      setLoading(true);
      try {
        await api.post('/api/auth/register', userData);
        showToast('Registration successful! You can now log in.', 'success');
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // 🔹 Wylogowanie
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.warn('Logout failed on API, clearing local session anyway.', e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      showToast('You have been logged out.', 'info');
    }
  }, [showToast]);

  // 🔹 Automatyczna aktualizacja tokenów
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail?.accessToken;
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('✅ Token updated in AuthContext (event).');
      }
    };

    const handleAuthError = () => {
      console.warn('⚠️ Auth error received — logging out user (event).');
      logout();
    };

    globalThis.addEventListener('token-refreshed', handleTokenRefreshed);
    globalThis.addEventListener('auth-error', handleAuthError);

    return () => {
      globalThis.removeEventListener('token-refreshed', handleTokenRefreshed);
      globalThis.removeEventListener('auth-error', handleAuthError);
    };
  }, [logout]);

  const refreshAndRetry = useCallback(
    async (signal) => {
      const refreshResp = await api.post('/api/auth/refresh', {}, { signal });
      const newToken = refreshResp?.data?.accessToken;
      if (!newToken) throw new Error('Refresh did not return a token.');

      localStorage.setItem('token', newToken);
      const retried = await api.get('/api/auth/me', { signal });
      setUser(retried.data);
      setIsAuthenticated(true);
      globalThis.dispatchEvent(
        new CustomEvent('token-refreshed', { detail: { accessToken: newToken } })
      );
    },
    []
  );

  const handleInitError = useCallback(
    async (err, signal) => {
      if (err.name === 'CanceledError') return;

      const status = err?.response?.status;
      console.warn('Initial /api/auth/me failed:', status, err?.message || err);

      if (status !== 401) return;

      try {
        await refreshAndRetry(signal);
      } catch (refreshError) {
        if (refreshError.name === 'CanceledError') return;
        console.warn('Refresh attempt failed during initialization:', refreshError?.response?.data || refreshError?.message || refreshError);
        if (isAuthenticated) {
          logout();
        }
      }
    },
    [refreshAndRetry, isAuthenticated, logout]
  );

  // === Inicjalizacja sesji po starcie aplikacji ===
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const resp = await api.get('/api/auth/me', { signal });
        setUser(resp.data);
        setIsAuthenticated(true);
      } catch (err) {
        await handleInitError(err, signal);
      }

      setIsLoading(false);
    };

    if (justLoggedIn) {
      setIsLoading(false);
    } else {
      initializeAuth();
    }

    return () => controller.abort();
  }, [justLoggedIn, logout, isAuthenticated, refreshAndRetry, handleInitError]); // Dodajemy isAuthenticated, aby poprawnie obsłużyć wylogowanie wewnątrz catch

  const providerValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    loading,
    login,
    logout,
    register,
    setUser,
  }), [user, isAuthenticated, isLoading, loading, login, logout, register]);

  return (
    <AuthContext.Provider
      value={providerValue}
    >
      {/* Renderuj dzieci tylko wtedy, gdy inicjalizacja jest zakończona */}
      {/* To zapobiega renderowaniu `DashboardProvider` zanim `isAuthenticated` będzie stabilne. */}
      {isLoading ? <div className="loading">Initializing session...</div> : children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
