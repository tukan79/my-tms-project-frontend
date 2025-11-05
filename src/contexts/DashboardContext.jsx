// frontend/src/contexts/DashboardContext.jsx
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardState, useDataFetching } from '@/hooks/useDashboard.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';

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

  // 📦 Lokalny stan i logika dashboardu
  const state = useDashboardState();
  const dataFetching = useDataFetching(user?.role);
  const isRefreshing = useRef(false); // zapobieganie zbyt częstemu refreshowaniu

  /** 🔐 Wylogowanie z pełnym resetem */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  /** ✅ Sukces po wysłaniu formularza */
  const handleFormSuccess = useCallback(() => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    dataFetching
      .refreshAll()
      .catch((err) => {
        console.error('❌ Error during refreshAll after form success:', err);
        showToast('Failed to refresh dashboard data.', 'error');
      })
      .finally(() => {
        state.handleCancelForm();
        setTimeout(() => (isRefreshing.current = false), 800);
      });
  }, [dataFetching, showToast, state]);

  /** 📤 Uniwersalny eksport */
  const handleGenericExport = useCallback(
    async (resource) => {
      try {
        if (!resource) throw new Error('Resource not specified for export.');
        const response = await api.get(`/api/${resource}/export`, {
          responseType: 'blob',
        });

        // Jeśli API zwróci plik
        if (response.headers['content-type']?.includes('application')) {
          const blob = new Blob([response.data]);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${resource}_export_${new Date().toISOString()}.csv`;
          link.click();
          URL.revokeObjectURL(link.href);
          showToast(`✅ Exported ${resource} successfully.`, 'success');
        } else {
          showToast(response.data?.message || `Export for ${resource} completed.`, 'info');
        }
      } catch (error) {
        console.error('❌ Export error:', error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          `Failed to export ${resource}.`;
        showToast(errorMessage, 'error');
      }
    },
    [showToast]
  );

  /** 🧩 Łączymy wszystko w jedno */
  const value = useMemo(
    () => ({
      ...state,
      ...dataFetching,
      user,
      handleLogout,
      handleFormSuccess,
      handleGenericExport,
    }),
    [state, dataFetching, user, handleLogout, handleFormSuccess, handleGenericExport]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
