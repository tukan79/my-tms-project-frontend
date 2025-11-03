import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardState, useDataFetching } from '../hooks/useDashboard.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import api from '../services/api.js';

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const state = useDashboardState();
  const dataFetching = useDataFetching(user?.role); // Przekazujemy rolę do hooka

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFormSuccess = () => {
    dataFetching.refreshAll(); // Używamy refreshAll z dataFetching
    state.handleCancelForm();
  };

  const handleGenericExport = async (resource) => {
    try {
      const response = await api.get(`/api/${resource}/export`);
      showToast(response.data.message || `Export for ${resource} successful!`, 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Failed to export ${resource}.`;
      showToast(errorMessage, 'error');
    }
  };

  const value = {
    ...state,
    ...dataFetching, // Przekazujemy cały obiekt z hooka
    user,
    handleLogout,
    handleFormSuccess,
    handleGenericExport,
  };

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
};
// ostatnia zmiana (30.05.2024, 13:14:12)