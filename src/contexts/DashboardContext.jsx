// frontend/src/contexts/DashboardContext.jsx
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard as useDataFetching } from '@/hooks/useDashboard.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';
import { safeParseData, logDataState } from '@/utils/dataHelpers.js';
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
  const [currentView, setCurrentView] = React.useState("runs"); // Initialize as null
  const [showForm, setShowForm] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState(null);
  const [importerConfig, setImporterConfig] = React.useState(null);
  const [modalState, setModalState] = React.useState(() => ({ isOpen: false }));
  const [globalAutoRefresh, setGlobalAutoRefresh] = React.useState(true);

  const handleViewChange = useCallback((view) => setCurrentView(view), []);
  const handleEditClick = useCallback((item) => {
    setItemToEdit(structuredClone(item));
    setShowForm(true);
  }, []);
  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setItemToEdit(null);
  }, []);

  const handleShowImporter = useCallback((config) => setImporterConfig(config), []);
  const handleHideImporter = useCallback(() => setImporterConfig(null), []);
  const handleDeleteRequest = useCallback((message, onConfirm) => setModalState({ isOpen: true, message, onConfirm }), []);
  const handleCloseModal = useCallback(() => setModalState({ isOpen: false }), []);

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

  const state = useDashboardStateManagement();

  // Pobieranie danych
  const dataFetching = useDataFetching(isAuthenticated ? user?.role : null);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const isRefreshing = useRef(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleFormSuccess = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      await dataFetching.handleRefresh?.(state.currentView);
    } catch (err) {
      console.error('❌ Error during refresh after form success:', err);
      showToast('Failed to refresh dashboard data.', 'error');
    } finally {
      state.handleCancelForm?.();
      setTimeout(() => {
        isRefreshing.current = false;
      }, 800);
    }
  }, [dataFetching, showToast, state]);

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

  const viewConfig = useMemo(() => { // eslint-disable-line
    console.log('🔍 Generating view config with data:', {
      hasRuns: !!dataFetching.runs,
      runsCount: dataFetching.runs?.length,
      userRole: user?.role
    });

    if (!dataFetching.runs) {
      console.log('⚠️ No data available for view config');
      return {};
    }

    const allExpectedDataKeys = [
      'orders', 'drivers', 'trucks', 'trailers', 'users', 'assignments',
      'customers', 'zones', 'surcharges', 'invoices', 'runs'
    ];

    const safeData = safeParseData(dataFetching.data || {}, allExpectedDataKeys);
    logDataState(safeData, 'Dashboard Context');

    const config = generateViewConfig({
      user,
      data: { runs: dataFetching.runs, surchargeTypes: dataFetching.surchargeTypes },
      actions: { runs: { delete: dataFetching.deleteRun } },
            handleDeleteRequest: state.handleDeleteRequest,
      handleRefresh: dataFetching.refreshRuns, // Przekazanie funkcji odświeżania
      refreshAll: dataFetching.refreshRuns,
    });

    console.log('🎯 Generated view config keys:', Object.keys(config));
    return config;

  }, [user, dataFetching.runs, dataFetching.surchargeTypes, dataFetching.deleteRun, dataFetching.refreshRuns, state.handleDeleteRequest]);
  
  React.useEffect(() => {
    console.log('🔍 Initializing currentView:', {
      currentView: state.currentView,
      viewConfigKeys: Object.keys(viewConfig),
      hasData: !!dataFetching.data,
      isLoading: dataFetching.isLoading
    });

    if (state.currentView === null && 
        Object.keys(viewConfig).length > 0 &&
        !dataFetching.isLoading) {
      
      const availableViews = Object.keys(viewConfig);
      console.log('📋 Available views:', availableViews);
      
      let defaultView = 'orders';
      if (!availableViews.includes('orders')) {
        defaultView = availableViews.includes('planit') ? 'planit' : availableViews[0];
      }
      
      console.log('🎯 Setting default view to:', defaultView);
      if (mountedRef.current) {
        state.handleViewChange(defaultView);
      }
    }
  }, [viewConfig, state.currentView, dataFetching.isLoading, state]);

  const shouldRenderChildren = useMemo(() => {
    const conditions = {
      isLoading: dataFetching.loading,
      noCurrentView: !state.currentView,
      noViewConfig: !viewConfig[state.currentView],
    };
    console.log('🔍 Render conditions:', conditions);
    return !dataFetching.loading && state.currentView && viewConfig[state.currentView];
  }, [dataFetching.loading, state.currentView, viewConfig]);

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
      {shouldRenderChildren ?
        children
       : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {dataFetching.loading ? 'Loading dashboard data...' : 'Initializing dashboard...'}
            </p>
            {state.currentView && !viewConfig[state.currentView] &&
              <p className="text-sm text-orange-600 mt-2">
                Configuring view: {state.currentView}
              </p>
            }
          </div>
        </div>
      )}
    </DashboardContext.Provider>
  );
};
