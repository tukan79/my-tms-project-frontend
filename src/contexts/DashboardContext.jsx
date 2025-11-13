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
  const [currentView, setCurrentView] = React.useState(null); // Initialize as null
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
  // Poprawka: Funkcja powinna ustawiać otrzymaną konfigurację, a nie próbować odczytywać z `importerConfig`.
  const handleShowImporter = (config) => setImporterConfig(config);
  const handleHideImporter = () => setImporterConfig(null);
  const handleDeleteRequest = (message, onConfirm) => setModalState({ isOpen: true, message, onConfirm });
  const handleCloseModal = () => setModalState({ isOpen: false });

  // We use useMemo to stabilize the state object and prevent unnecessary re-renders in child components.
  return useMemo(
    () => ({
      currentView, handleViewChange,
      showForm, setShowForm,
      itemToEdit, setItemToEdit, handleEditClick, handleCancelForm,
      importerConfig, handleShowImporter, handleHideImporter,
      modalState, handleDeleteRequest, handleCloseModal,
      globalAutoRefresh, setGlobalAutoRefresh,
    }),
    [currentView, showForm, itemToEdit, importerConfig, modalState, globalAutoRefresh]
  );
};

export const DashboardProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // 🧩 Inicjalizacja stanu dashboardu
  const state = useDashboardStateManagement();

  // 🔄 Pobieranie danych jest teraz bezwarunkowe.
  // Hook `useDataFetching` jest wywoływany tylko po uwierzytelnieniu.
  const dataFetching = useDataFetching(isAuthenticated ? user?.role : null);


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
      // Poprawka: Zamiast odświeżać wszystko, odświeżamy tylko dane dla bieżącego widoku.
      // To zapobiega lawinie zapytań API po imporcie.
      await dataFetching.handleRefresh?.(state.currentView);
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
      data: dataFetching.data,
      // Przekazujemy tylko te akcje, które są faktycznie potrzebne w konfiguracji widoków.
      // Upraszcza to zależności i zapobiega błędom.
      actions: dataFetching.actions,
      handleDeleteRequest: state.handleDeleteRequest,
      refreshAll: dataFetching.handleRefresh, // Przekazujemy funkcję odświeżania
    });
  }, [user, dataFetching.data, dataFetching.actions, state.handleDeleteRequest, dataFetching.handleRefresh]);

  // Set initial currentView based on user role and available views
  React.useEffect(() => {
    // Only set if currentView is null (initial state) and viewConfig is available
    if (state.currentView === null && viewConfig && Object.keys(viewConfig).length > 0) {
      const availableViews = Object.keys(viewConfig);
      // Try to default to 'orders' if available, otherwise pick the first one
      const defaultView = availableViews.includes('orders') ? 'orders' : availableViews[0];
      state.handleViewChange(defaultView);
    }
  }, [viewConfig, state.currentView, state.handleViewChange]);


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
      {/* Prevent children from rendering until the initial view is set */}
      {!state.currentView ? (
        <div className="loading">Initializing dashboard...</div>
      ) : (
        // Ta linia obsługuje przypadek, gdy prop 'children' jest obiektem,
        // który sam w sobie zawiera właściwe elementy React pod kluczem 'children'.
        // Jest to często spowodowane nieprawidłowym przekazywaniem propsów w komponencie nadrzędnym.
        children.children || children
      )}
    </DashboardContext.Provider>
  );
};
