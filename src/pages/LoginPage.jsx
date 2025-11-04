import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext.jsx';
import { Moon, Sun } from 'lucide-react';
import '../Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { showToast } = useToast();
  const emailInputRef = useRef(null);

  // 🔹 Inicjalizacja stanu
  const [credentials, setCredentials] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // 🔹 Synchronizuj motyw z localStorage i <body>
  useEffect(() => {
    document.body.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 🔹 Aktualizacja pól formularza
  const handleChange = (e) => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };

  // 🔹 Obsługa logowania
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = credentials;

    try {
      await login(email, password);
      showToast('Login successful!', 'success');

      // Jeśli Remember Me jest zaznaczone — zapisz email
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage =
        err.response?.data?.error || 'Login failed. Please check your credentials.';
      showToast(errorMessage, 'error');
      setCredentials((prev) => ({ ...prev, password: '' }));
      emailInputRef.current?.focus();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* 🔹 Nagłówek z przełącznikiem trybu */}
        <div className="auth-header">
          <h2>Login</h2>
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="theme-toggle"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              ref={emailInputRef}
              type="email"
              id="email"
              value={credentials.email}
              onChange={handleChange}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {/* 🔹 Remember Me */}
          <div className="form-group remember-me">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />{' '}
              Remember Me
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account?{' '}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

// ostatnia zmiana (04.11.2025, 23:07)
