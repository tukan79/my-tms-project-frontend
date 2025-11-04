// AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Poprawiona weryfikacja tokenu
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Ustaw token przed weryfikacją
        setToken(storedToken);
        
        // Prostsza weryfikacja - pobierz dane użytkownika
        const response = await api.get('/api/users/me');
        const userData = response.data;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Aktualizuj dane w localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
      } catch (error) {
        console.error('Token verification failed:', error);
        
        // Sprawdź czy to błąd 401 i spróbuj odświeżyć token
        if (error.response?.status === 401) {
          await attemptTokenRefresh();
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Próba odświeżenia tokenu
  const attemptTokenRefresh = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', { 
        refreshToken 
      });
      
      const newToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken;

      localStorage.setItem('token', newToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      setToken(newToken);
      setIsAuthenticated(true);
      
      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Nasłuchiwanie na błędy autoryzacji
  useEffect(() => {
    const handleAuthError = async (event) => {
      console.log('🔄 Auth error detected, attempting token refresh...');
      
      // Spróbuj odświeżyć token zamiast od razu wylogowywać
      const refreshSuccess = await attemptTokenRefresh();
      
      if (!refreshSuccess && event.detail?.retry) {
        // Jeśli odświeżenie nie powiodło się i mamy funkcję do ponowienia
        event.detail.retry();
      }
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

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
    console.log('🔐 Attempting login...');
    
    try {
      const response = await api.post('/api/auth/login', { email, password });
      console.log('✅ Login response:', response.data);
      
      const { accessToken, refreshToken, user: userData } = response.data;
      
      if (!accessToken) {
        throw new Error('No authentication token received');
      }

      console.log('🔑 Token from accessToken:', `YES (${accessToken.substring(0, 20)}...)`);
      
      // ZAPISZ DANE
      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      
      // USTAW STAN
      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ Token and user saved to localStorage');
      return userData;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Czyszczenie w przypadku błędu
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      
      // Auto-login after registration
      if (response.data.accessToken) {
        const { accessToken, refreshToken, user } = response.data;
        
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setToken(accessToken);
        setUser(user);
        setIsAuthenticated(true);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    
    // Czyszczenie localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    
    // Reset stanu
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Opcjonalnie: wywołaj endpoint logout na backendzie
    try {
      api.post('/api/auth/logout').catch(() => {}); // Ignoruj błędy
    } catch (error) {
      // Ignoruj błędy przy wylogowywaniu
    }
  };

  // Funkcja do wymuszenia odświeżenia tokenu
  const refreshToken = async () => {
    return await attemptTokenRefresh();
  };

  const value = {
    user,
    token,
    login,
    logout,
    register,
    refreshToken,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;