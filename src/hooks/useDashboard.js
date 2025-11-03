import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApiResource } from './useApiResource';
import { useBroadcastChannel } from './useBroadcastChannel.js';
import { importerConfig } from '../config/importerConfig.js';

/**
 * Manages the UI state of the dashboard, including the current view,
 * Zarządza stanem interfejsu użytkownika pulpitu, w tym bieżącym widokiem,
 * form visibility, and modal states.
 * widocznością formularzy i stanami modali.
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

  const handleViewChange = (view) => {
    setCurrentView(view);
    setShowForm(false);
    setActiveImporterConfig(null);
    setItemToEdit(null);
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setActiveImporterConfig(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setItemToEdit(null);
  };

  const handleShowImporter = (view) => setActiveImporterConfig(importerConfig[view]);
  const handleHideImporter = () => setActiveImporterConfig(null);

  const handleDeleteRequest = (message, confirmCallback) => {
    setModalState({
      isOpen: true,
      message,
      onConfirm: async () => {
        await confirmCallback();
        setModalState({ isOpen: false, message: '', onConfirm: () => {} });
      },
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, message: '', onConfirm: () => {} });
  };

  return {
    currentView,
    showForm,
    itemToEdit,
    importerConfig: activeImporterConfig,
    modalState,
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
 * Fetches all necessary data for the dashboard based on user role.
 * Pobiera wszystkie niezbędne dane dla pulpitu na podstawie roli użytkownika.
 */
export const useDataFetching = (role) => {
  const { isAuthenticated } = useAuth();
  const isAdmin = role === 'admin';
  const isDispatcher = role === 'dispatcher';

  // Używamy useMemo, aby uniknąć ponownego tworzenia obiektu `resources` przy każdym renderowaniu,
  // chyba że zmienią się uprawnienia.
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

  const refreshAll = useCallback(() => {
    console.log('🔄 Refreshing all resources...');
    Object.values(resources).forEach(resource => resource.fetchData && resource.fetchData());
  }, [resources]);
  
  useBroadcastChannel(refreshAll);

  // Destrukturyzacja zasobów w celu uzyskania stabilnych referencji do poszczególnych haków.
  // Destructuring resources to get stable references for individual hooks.
  const { orders, drivers, trucks, trailers, users, assignments, runs, customers, zones } = resources;

  const isLoading = useMemo(() => 
    Object.values(resources).some(r => r.isLoading),
    [resources]
  );

  const anyError = useMemo(() => 
    Object.values(resources).map(r => r.error).find(e => e != null),
    [resources]
  );

  const handleRefresh = (view) => {
    if (resources[view] && resources[view].fetchData) {
      resources[view].fetchData();
    }
  };

  // KLUCZOWA ZMIANA: Gwarantujemy, że `data` zawsze będzie obiektem
  // z tablicami dla każdego zasobu. To eliminuje błędy `cannot read .length`
  // w całej aplikacji.
  const data = Object.fromEntries(
    Object.keys(resources).map(key => {
      const resource = resources[key];
      // Używamy `resource.data` jeśli jest dostępne i jest tablicą.
      // W przeciwnym razie (np. podczas ładowania, błędu, lub gdy API zwróci coś innego),
      // zwracamy pustą tablicę.
      const safeData = Array.isArray(resource.data) ? resource.data : [];
      return [key, safeData];
    })
  );

  const actions = Object.fromEntries(
    Object.entries(resources).map(([key, resource]) => [key, {
      create: resource.createResource,
      update: resource.updateResource,
      delete: resource.deleteResource,
      bulkCreate: resource.bulkCreate,
    }])
  );

  return { data, isLoading, anyError, handleRefresh, refreshAll, actions };
};
// ostatnia zmiana (30.05.2024, 13:14:12)