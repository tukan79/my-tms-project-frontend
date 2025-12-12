// frontend/src/contexts/DashboardContext.jsx
import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { useDashboard as useDataFetching } from "@/hooks/useDashboard.js";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useToast } from "@/contexts/ToastContext.jsx";
import api from "@/services/api.js";
import { safeParseData, logDataState } from "@/utils/dataHelpers.js";
import { generateViewConfig } from "../config/viewConfig.jsx";
import PropTypes from "prop-types";

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};

/* -------------------------------------------------------------
 *  STATE MANAGEMENT SUBHOOK
 * ------------------------------------------------------------- */
const useDashboardStateManagement = () => {
  const [currentView, setCurrentView] = useState("runs");
  const [showForm, setShowForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [importerConfig, setImporterConfig] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false });

  const [globalAutoRefresh, setGlobalAutoRefresh] = useState(true);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    setShowForm(false);
    setItemToEdit(null);
    setImporterConfig(null);
  }, []);

  const handleEditClick = useCallback((item) => {
    setItemToEdit(item ? structuredClone(item) : null);
    setShowForm(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setItemToEdit(null);
  }, []);

  const handleShowImporter = useCallback((config) => {
    setImporterConfig(config);
  }, []);

  const handleHideImporter = useCallback(() => {
    setImporterConfig(null);
  }, []);

  const handleDeleteRequest = useCallback((message, onConfirm) => {
    setModalState({ isOpen: true, message, onConfirm });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false });
  }, []);

  return useMemo(
    () => ({
      currentView,
      handleViewChange,
      showForm,
      setShowForm,
      itemToEdit,
      setItemToEdit,
      handleEditClick,
      handleCancelForm,
      importerConfig,
      handleShowImporter,
      handleHideImporter,
      modalState,
      handleDeleteRequest,
      handleCloseModal,
      globalAutoRefresh,
      setGlobalAutoRefresh,
    }),
    [
      currentView,
      showForm,
      itemToEdit,
      importerConfig,
      modalState,
      globalAutoRefresh,
      handleViewChange,
      handleEditClick,
      handleCancelForm,
      handleShowImporter,
      handleHideImporter,
      handleDeleteRequest,
      handleCloseModal,
    ]
  );
};

/* -------------------------------------------------------------
 *  DASHBOARD PROVIDER
 * ------------------------------------------------------------- */
export const DashboardProvider = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const state = useDashboardStateManagement();
  const navigate = useNavigate();

  const dataFetching = useDataFetching(isAuthenticated ? user?.role : null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const logoutAndRedirect = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  /* -------------------------------------------------------------
   * FORM SUCCESS HANDLER — refresh only once per submit
   * ------------------------------------------------------------- */
  const refreshingRef = useRef(false);

  const handleFormSuccess = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      await dataFetching.handleRefresh?.(state.currentView);
    } catch (err) {
      console.error("Refresh error:", err);
      showToast("Failed to refresh updated data.", "error");
    } finally {
      state.handleCancelForm();

      setTimeout(() => {
        refreshingRef.current = false;
      }, 300);
    }
  }, [dataFetching.handleRefresh, state, showToast]);

  /* -------------------------------------------------------------
   * GENERIC EXPORT
   * ------------------------------------------------------------- */
  const handleGenericExport = useCallback(
    async (resource) => {
      try {
        const response = await api.get(`/api/${resource}/export`, {
          responseType: "blob",
        });

        const blob = new Blob([response.data]);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${resource}_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        showToast(`Exported ${resource} successfully.`, "success");
      } catch (err) {
        console.error("Export error:", err);
        showToast("Export failed.", "error");
      }
    },
    [showToast]
  );

  /* -------------------------------------------------------------
   * VIEW CONFIG GENERATION
   * ------------------------------------------------------------- */
  const viewConfig = useMemo(() => {
    if (!dataFetching.data) return {};

    const requiredKeys = [
      "orders",
      "drivers",
      "trucks",
      "trailers",
      "users",
      "assignments",
      "customers",
      "zones",
      "surcharges",
      "invoices",
      "runs",
    ];

    const safeData = safeParseData(dataFetching.data, requiredKeys);
    logDataState(safeData, "DashboardContext");

    return generateViewConfig({
      user,
      data: dataFetching,
      actions: {
        runs: { delete: dataFetching.deleteRun },
      },
      handleDeleteRequest: state.handleDeleteRequest,
      handleRefresh: dataFetching.handleRefresh,
      refreshAll: dataFetching.handleRefresh,
    });
  }, [user, dataFetching.data, state.handleDeleteRequest]);

  /* -------------------------------------------------------------
   * AUTO REFRESH — only current view
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!state.globalAutoRefresh) return;

    const interval = setInterval(() => {
      dataFetching.handleRefresh?.(state.currentView);
    }, 15000);

    return () => clearInterval(interval);
  }, [state.globalAutoRefresh, state.currentView, dataFetching.handleRefresh]);

  /* -------------------------------------------------------------
   * INITIAL VIEW SELECTION
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (dataFetching.loading) return;
    const keys = Object.keys(viewConfig);
    if (!keys.length) return;

    if (!viewConfig[state.currentView]) {
      const defaultView = viewConfig["orders"]
        ? "orders"
        : keys[0];

      state.handleViewChange(defaultView);
    }
  }, [dataFetching.loading, viewConfig]);

  /* -------------------------------------------------------------
   * READY CONDITION
   * ------------------------------------------------------------- */
  const ready = !dataFetching.loading && Object.keys(viewConfig).length > 0;

  /* -------------------------------------------------------------
   * FINAL PROVIDER VALUE
   * ------------------------------------------------------------- */
  const providerValue = useMemo(
    () => ({
      ...dataFetching,
      ...state,
      user,
      viewConfig,
      handleLogout: logoutAndRedirect,
      handleFormSuccess,
      handleGenericExport,
    }),
    [
      dataFetching,
      state,
      user,
      viewConfig,
      logoutAndRedirect,
      handleFormSuccess,
      handleGenericExport,
    ]
  );

  /* -------------------------------------------------------------
   * MODERN LOADING SCREEN (Skeleton-ready)
   * ------------------------------------------------------------- */
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-gray-600">
          <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-500 border-b-transparent"></div>
          <p className="text-sm tracking-wide">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={providerValue}>
      {children}
    </DashboardContext.Provider>
  );
};

DashboardProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
