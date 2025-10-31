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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          // Zamiast dedykowanego endpointu /verify, próbujemy pobrać dane z chronionego zasobu.
          // Jeśli to zapytanie się powiedzie (status 200), oznacza to, że token jest ważny.
          await api.get('/api/users'); // Jeśli to zwróci 200, token jest OK
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed:', error);
          logout(); // Wyloguj, jeśli token jest nieprawidłowy
        }
      }
      setLoading(false);
    };

    // This effect should only run once on initial mount
    verifyToken();
    // Zmieniamy zależność na `token`, aby weryfikacja uruchamiała się ponownie,
    // gdy token się zmieni (np. po zalogowaniu).
  }, [token]);

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
      
      // KLUCZOWA ZMIANA: Użyj TYLKO accessToken
      const token = response.data.accessToken;
      
      console.log('🔑 Token from accessToken:', token ? `YES (${token.substring(0, 20)}...)` : 'NO');
      
      if (token) {
        // ZAPISZ TOKEN
        localStorage.setItem('token', token);
        
        // ZAPISZ USER DATA
        const userData = response.data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ Token and user saved to localStorage');
        
        setToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        
        return userData;
      } else {
        console.error('❌ No accessToken found in response');
        throw new Error('No authentication token received');
      }
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
  };

  // Do not render children until the initial loading (token verification) is complete.
  // This prevents rendering the app in a temporary unauthenticated state.
  return (
    <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
  );
};

export default AuthContext;