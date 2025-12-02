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

  // Auto refresh flag
  const [globalAutoRefresh, setGlobalAutoRefresh] = useState(true);

  const handleViewChange = useCallback((view) => setCurrentView(view), []);

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
 *  PROVIDER
 * ------------------------------------------------------------- */
export const DashboardProvider = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const state = useDashboardStateManagement();
  const navigate = useNavigate();

  // Ładowanie wszystkich danych
  const dataFetching = useDataFetching(isAuthenticated ? user?.role : null);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isRefreshing = useRef(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  /* -------------------------------------------------------------
   *  REFRESH PO ZAPISIE FORMULARZA
   * ------------------------------------------------------------- */
  const handleFormSuccess = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      await dataFetching.handleRefresh?.(state.currentView);
    } catch (err) {
      console.error("Refresh error:", err);
      showToast("Failed to refresh dashboard data.", "error");
    } finally {
      state.handleCancelForm();
      setTimeout(() => {
        isRefreshing.current = false;
      }, 500);
    }
  }, [dataFetching, showToast, state]);

  /* -------------------------------------------------------------
   *  EXPORT GENERIC
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
   *  VIEW CONFIG
   * ------------------------------------------------------------- */
  const viewConfig = useMemo(() => {
    if (!dataFetching.data) return {};

    const expectedKeys = [
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

    const safeData = safeParseData(dataFetching.data, expectedKeys);
    logDataState(safeData, "DashboardContext");

    return generateViewConfig({
      user,
      data: dataFetching,
      actions: {
        runs: { delete: dataFetching.deleteRun },
      },
      handleDeleteRequest: state.handleDeleteRequest,

      // 🔥 KLUCZOWE NAPRAWIONE:
      handleRefresh: dataFetching.handleRefresh,
      refreshAll: dataFetching.handleRefresh,
    });
  }, [user, dataFetching, state.handleDeleteRequest]);

  /* -------------------------------------------------------------
   *  AUTO REFRESH — PRACUJE TYLKO DLA AKTUALNEGO WIDOKU
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!state.globalAutoRefresh) return;

    const interval = setInterval(() => {
      dataFetching.handleRefresh?.(state.currentView);
    }, 15000); // co 15 sekund

    return () => clearInterval(interval);
  }, [state.globalAutoRefresh, state.currentView, dataFetching]);

  /* -------------------------------------------------------------
   * INITIAL VIEW SELECTION
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!dataFetching.loading && state.currentView && viewConfig[state.currentView]) return;

    if (!dataFetching.loading && Object.keys(viewConfig).length > 0) {
      const preferredView = "orders";
      const firstAvailable = Object.keys(viewConfig)[0];
      const newView = viewConfig[preferredView] ? preferredView : firstAvailable;

      if (mountedRef.current) {
        state.handleViewChange(newView);
      }
    }
  }, [dataFetching.loading, state.currentView, viewConfig, state.handleViewChange]);

  const ready =
    !dataFetching.loading &&
    state.currentView &&
    viewConfig[state.currentView];

  const providerValue = useMemo(
    () => ({
      ...state,
      ...dataFetching,
      handleRefresh: dataFetching.handleRefresh, // 🔥 poprawione
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

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {dataFetching.loading ? "Loading dashboard..." : "Preparing view..."}
          </p>
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
