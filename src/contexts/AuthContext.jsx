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
        
        // Jeśli weryfikacja nie powiedzie się (np. token wygasł), wyloguj
        if (error.response?.status !== 401) { // Nie wylogowuj przy 401, interceptor to obsłuży
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Nasłuchiwanie na zdarzenia odświeżenia i błędu tokenu z interceptora
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      console.log('🔄 AuthContext: Token refreshed, updating state.');
      setToken(event.detail.accessToken);
      setIsAuthenticated(true);
    };

    const handleAuthError = () => {
      console.log('AuthContext: Auth error detected, logging out.');
      logout();
    };

    window.addEventListener('token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

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

  const value = {
    user,
    token,
    login,
    logout,
    register,
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