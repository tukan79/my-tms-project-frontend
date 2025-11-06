// frontend/src/contexts/AuthContext.jsx
import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
} from 'react';
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
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Ładowanie początkowe
  const { showToast } = useToast();

  // 🔹 Ładowanie profilu użytkownika po tokenie
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (error) {
      console.warn('⚠️ Failed to fetch user info:', error);
      setUser(null);
    }
  }, []);

  // 🔹 Logowanie użytkownika
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data } = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', data.accessToken);
        setUser(data.user);
        setIsAuthenticated(true);
        showToast('Login successful', 'success');
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // 🔹 Rejestracja
  const register = useCallback(
    async (userData) => {
      setLoading(true);
      try {
        await api.post('/api/auth/register', userData);
        showToast('Registration successful! You can now log in.', 'success');
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // 🔹 Wylogowanie
  const logout = useCallback(
    async () => {
      try {
        await api.post('/api/auth/logout');
      } catch (e) {
        console.warn('Logout failed on API, clearing local session anyway.');
      } finally {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        showToast('You have been logged out.', 'info');
      }
    },
    [showToast]
  );

  // 🔹 Automatyczne odświeżanie tokena (event z api.js)
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail?.accessToken;
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('✅ Token updated in AuthContext.');
      }
    };

    const handleAuthError = () => {
      console.warn('⚠️ Auth error received — logging out user.');
      logout();
    };

    window.addEventListener('token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-error', handleAuthError);
    return () => {
      window.removeEventListener('token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [logout]);

  // === Wczytanie sesji przy starcie aplikacji ===
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Session validation failed:', err);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loading,
        login,
        logout,
        register,
        setUser,
        fetchUser,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
// ostatnia zmiana (04.11.2025, 23:07)