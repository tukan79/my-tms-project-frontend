// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // lub inny plik stylów
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx'; // Import globalnego ErrorBoundary
import App from './App.jsx';
import './index.css'; // lub inny plik stylów

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
// ostatnia zmiana (30.05.2024, 13:14:12)