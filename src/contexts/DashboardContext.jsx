// frontend/src/contexts/DashboardContext.jsx
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataFetching } from '@/hooks/useDashboard.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';
import { generateViewConfig } from '../config/viewConfig.jsx';

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

const useDashboardStateManagement = () => {
  const [currentView, setCurrentView] = React.useState('orders');
  const [showForm, setShowForm] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState(null);
  const [importerConfig, setImporterConfig] = React.useState(null);
  const [modalState, setModalState] = React.useState({ isOpen: false });
  const [globalAutoRefresh, setGlobalAutoRefresh] = React.useState(true);

  const handleViewChange = (view) => setCurrentView(view);
  const handleEditClick = (item) => {
    setItemToEdit(item);
    setShowForm(true);
  };
  const handleCancelForm = () => {
    setShowForm(false);
    setItemToEdit(null);
  };
  const handleShowImporter = (view) => setImporterConfig(importerConfig[view]);
  const handleHideImporter = () => setImporterConfig(null);
  const handleDeleteRequest = (message, onConfirm) => setModalState({ isOpen: true, message, onConfirm });
  const handleCloseModal = () => setModalState({ isOpen: false });

  return {
    currentView, handleViewChange,
    showForm, setShowForm,
    itemToEdit, setItemToEdit, handleEditClick, handleCancelForm,
    importerConfig, handleShowImporter, handleHideImporter,
    modalState, handleDeleteRequest, handleCloseModal,
    globalAutoRefresh, setGlobalAutoRefresh,
  };
};

export const DashboardProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  // 🧩 Inicjalizacja stanu dashboardu
  const state = useDashboardStateManagement();

  // 🔄 Bezpieczne pobieranie danych — jeśli user nie istnieje, zwróć pusty obiekt
  const dataFetching = user ? useDataFetching(user.role) : {
    data: {},
    actions: {},
    refreshAll: async () => {},
  };

  // Ref zabezpieczający przed spamem refreshy
  const isRefreshing = useRef(false);

  /** 🔐 Wylogowanie z pełnym resetem */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  /** ✅ Sukces po wysłaniu formularza */
  const handleFormSuccess = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      await dataFetching.refreshAll?.();
    } catch (err) {
      console.error('❌ Error during refreshAll after form success:', err);
      showToast('Failed to refresh dashboard data.', 'error');
    } finally {
      state.handleCancelForm?.();
      setTimeout(() => {
        isRefreshing.current = false;
      }, 800);
    }
  }, [dataFetching, showToast, state]);

  /** 📤 Uniwersalny eksport */
  const handleGenericExport = useCallback(
    async (resource) => {
      try {
        if (!resource) throw new Error('Resource not specified for export.');

        const response = await api.get(`/api/${resource}/export`, {
          responseType: 'blob',
        });

        const contentType = response.headers['content-type'] || '';

        if (contentType.includes('application')) {
          const blob = new Blob([response.data]);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${resource}_export_${new Date().toISOString()}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(link.href);
          showToast(`✅ Exported ${resource} successfully.`, 'success');
        } else {
          showToast(
            response.data?.message || `Export for ${resource} completed.`,
            'info'
          );
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

  // 🧩 Generacja konfiguracji widoku z pełnym zabezpieczeniem
  const viewConfig = useMemo(() => {
    return generateViewConfig({
      user,
      data: dataFetching?.data || {},
      actions: dataFetching?.actions || {},
      refreshAll: dataFetching?.refreshAll,
      handleDeleteRequest: state?.handleDeleteRequest,
      handleEditOrderFromAnywhere: (order) => {
        console.log('Edit order:', order);
      },
      handlePrintLabels: (orderIds) => {
        console.log('Print labels:', orderIds);
      },
    });
  }, [
    user,
    dataFetching?.data,
    dataFetching?.actions,
    dataFetching?.refreshAll,
    state?.handleDeleteRequest,
  ]);

  // 🧱 Łączenie wszystkiego w jedno źródło prawdy
  const value = useMemo(
    () => ({
      ...state,
      ...dataFetching,
      user,
      viewConfig,
      handleLogout,
      handleFormSuccess,
      handleGenericExport,
    }),
    [
      state,
      dataFetching,
      user,
      viewConfig,
      handleLogout,
      handleFormSuccess,
      handleGenericExport,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
