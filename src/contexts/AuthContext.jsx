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
    api,
  };

  // Do not render children until the initial loading (token verification) is complete.
  // This prevents rendering the app in a temporary unauthenticated state.
  return (
    <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
  );
};

export default AuthContext;