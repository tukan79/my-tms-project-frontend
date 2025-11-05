import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext.jsx';

import '@/Auth.css';
const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { register, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register({ email, password, firstName, lastName });
      showToast('Account created successfully! You can now log in.', 'success');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      showToast(errorMessage, 'error');
      setPassword('');
      emailInputRef.current?.focus();
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              ref={emailInputRef}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch" style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

// ostatnia zmiana (04.11.2025, 23:27)
