import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useApiResource } from './useApiResource';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel.js'; // Keep for listening
import { importerConfig } from '@/config/importerConfig.js';

/**
 * Zarządza stanem interfejsu użytkownika pulpitu (widoki, formularze, modale, importery)
 */
export const useDashboardState = () => {
  const [currentView, setCurrentView] = useState('orders');
  const [showForm, setShowForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [activeImporterConfig, setActiveImporterConfig] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });
  const [globalAutoRefresh, setGlobalAutoRefreshState] = useState(
    () => localStorage.getItem('globalAutoRefresh') === 'true'
  );

  const setGlobalAutoRefresh = useCallback((isEnabled) => {
    localStorage.setItem('globalAutoRefresh', isEnabled);
    setGlobalAutoRefreshState(isEnabled);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
    setShowForm(false);
    setItemToEdit(null);
    setActiveImporterConfig(null);
  }, []);

  const handleEditClick = useCallback((item) => {
    setItemToEdit(item);
    setShowForm(true);
    setActiveImporterConfig(null);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setItemToEdit(null);
  }, []);

  const handleShowImporter = useCallback(
    (view) => setActiveImporterConfig(importerConfig[view]),
    []
  );
  const handleHideImporter = useCallback(() => setActiveImporterConfig(null), []);

  const handleDeleteRequest = useCallback((message, confirmCallback) => {
    setModalState({
      isOpen: true,
      message,
      onConfirm: async () => {
        await confirmCallback();
        setModalState({ isOpen: false, message: '', onConfirm: () => {} });
      },
    });
  }, []);

  const handleCloseModal = useCallback(
    () => setModalState({ isOpen: false, message: '', onConfirm: () => {} }),
    []
  );

  return {
    currentView,
    showForm,
    itemToEdit,
    importerConfig: activeImporterConfig,
    modalState,
    globalAutoRefresh,
    setGlobalAutoRefresh,
    handleViewChange,
    handleEditClick,
    handleCancelForm,
    handleShowImporter,
    handleHideImporter,
    handleDeleteRequest,
    handleCloseModal,
    setShowForm,
    setItemToEdit,
  };
};

/**
 * Pobiera wszystkie dane pulpitu na podstawie roli użytkownika.
 * Integruje się z kanałem broadcast, aby synchronizować dane między zakładkami.
 */
export const useDataFetching = (role) => {
  const { isAuthenticated } = useAuth();

  const isAdmin = role === 'admin';
  const isDispatcher = role === 'dispatcher';

  /** Użycie useMemo, żeby nie tworzyć nowych hooków w pętli — zachowuje stabilność. */
  const resources = useMemo(() => ({
    orders: useApiResource(isAuthenticated ? '/api/orders' : null),
    drivers: useApiResource(isAuthenticated && isAdmin ? '/api/drivers' : null),
    trucks: useApiResource(isAuthenticated && isAdmin ? '/api/trucks' : null),
    trailers: useApiResource(isAuthenticated && isAdmin ? '/api/trailers' : null),
    users: useApiResource(isAuthenticated && isAdmin ? '/api/users' : null),
    assignments: useApiResource(isAuthenticated ? '/api/assignments' : null),
    customers: useApiResource(isAuthenticated && (isAdmin || isDispatcher) ? '/api/customers' : null),
    zones: useApiResource(isAuthenticated && (isAdmin || isDispatcher) ? '/api/zones' : null),
    surcharges: useApiResource(isAuthenticated && isAdmin ? '/api/surcharge-types' : null),
    invoices: useApiResource(isAuthenticated && isAdmin ? '/api/invoices' : null),
    runs: useApiResource(isAuthenticated ? '/api/runs' : null, { initialFetch: false }),
  }), [isAuthenticated, isAdmin, isDispatcher]);

  /** Odświeża wszystkie zasoby jednocześnie */
  const refreshAll = useCallback(() => {
    Object.values(resources).forEach((res) => res.fetchData?.());
  }, [resources]);

  /** 🔄 Synchronizacja między zakładkami (debounce = 300ms) */
  useBroadcastChannel('tms_state_sync', {
    onMessage: (message) => {
      if (message?.type === 'REFRESH_ALL') {
        refreshAll();
      } else if (message?.type === 'REFRESH_VIEW' && message.view && resources[message.view]) {
        resources[message.view].fetchData?.();
      }
    },
    debounceMs: 300,
  });

  /** Odświeża tylko wybrany widok */
  const handleRefresh = useCallback(
    (view) => resources[view]?.fetchData?.(),
    [resources]
  );

  /** Dane w formacie klucz → tablica (nawet jeśli puste) */
  const data = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(resources).map(([key, resource]) => [key, resource.data || []])
      ),
    [resources, ...Object.values(resources).map((r) => r.data)]
  );

  /** Nowy, stabilniejszy stan ładowania */
  const isLoading = useMemo(
    () => Object.values(resources).some((r) => r.isLoading && !r.data),
    [resources, ...Object.values(resources).map((r) => r.isLoading)]
  );

  const anyError = useMemo(
    () => Object.values(resources).find((r) => r.error)?.error ?? null,
    [resources, ...Object.values(resources).map((r) => r.error)]
  );

  /** Akcje CRUD przypięte do każdego zasobu */
  const actions = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(resources).map(([key, res]) => [
          key,
          {
            create: res.createResource,
            update: res.updateResource,
            delete: res.deleteResource,
            bulkCreate: res.bulkCreate,
          },
        ])
      ),
    [resources]
  );

  return {
    data,
    isLoading,
    anyError,
    handleRefresh,
    refreshAll,
    actions,
  };
};

// ostatnia zmiana (04.11.2025, 21:02:00)
