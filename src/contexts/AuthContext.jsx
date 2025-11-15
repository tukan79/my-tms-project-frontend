// frontend/src/contexts/AuthContext.jsx
import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
} from 'react';
import axios from 'axios';
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
  const [isLoading, setIsLoading] = useState(true); // initial loading state
  const { showToast } = useToast();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  // 🔹 Logowanie użytkownika
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data } = await api.post('/api/auth/login', { email, password });
        // login returns { accessToken, user }
        if (data?.accessToken) {
          localStorage.setItem('token', data.accessToken);
        }
        setUser(data?.user || null);
        setIsAuthenticated(Boolean(data?.accessToken));
        showToast('Login successful', 'success');
      } catch (error) {
        console.error('Login failed:', error);
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
        console.log('✅ Token updated in AuthContext (event).');
      }
    };

    const handleAuthError = () => {
      console.warn('⚠️ Auth error received — logging out user (event).');
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
    let isMounted = true;
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // First try: call /me with current token (api will attach Authorization header)
        const resp = await api.get('/api/auth/me');
        if (!isMounted) return;
        // /api/auth/me returns the user payload directly (not wrapped as { user: ... })
        setUser(resp.data);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      } catch (err) {
        // If we get 401, attempt one refresh attempt (raw axios call to avoid interceptor race)
        const status = err?.response?.status;
        console.warn('Initial /api/auth/me failed:', status, err?.message || err);

        if (status === 401) {
          try {
            // Try refresh once using a raw axios POST to /api/auth/refresh with credentials
            const refreshResp = await axios.post(
              `${API_BASE}/api/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const newToken = refreshResp?.data?.accessToken;
            if (newToken) {
              // Persist token and retry /me
              localStorage.setItem('token', newToken);
              // Retry to fetch user using api (will pick up new token from localStorage via interceptor)
              const retried = await api.get('/api/auth/me');
              if (!isMounted) return;
              setUser(retried.data);
              setIsAuthenticated(true);
              setIsLoading(false);
              // emit token-refreshed event (other listeners may rely on it)
              window.dispatchEvent(new CustomEvent('token-refreshed', { detail: { accessToken: newToken } }));
              return;
            }
          } catch (refreshErr) {
            console.warn('Refresh attempt failed during initializeAuth:', refreshErr?.response?.data || refreshErr?.message || refreshErr);
            // fallthrough to cleanup
          }
        }

        // Any other error or failed refresh -> clear session
        if (isMounted) {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => { isMounted = false; };
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
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
