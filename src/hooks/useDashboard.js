import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useApiResource } from './useApiResource';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel.js';

export const useDataFetching = (role) => {
  const { isAuthenticated } = useAuth();

  const isAdmin = role === 'admin';
  const isDispatcher = role === 'dispatcher';

  // 🧱 Hooki muszą być wywołane zawsze w tej samej kolejności
  const orders = useApiResource(isAuthenticated ? '/api/orders' : null);
  const drivers = useApiResource(isAuthenticated && isAdmin ? '/api/drivers' : null);
  const trucks = useApiResource(isAuthenticated && isAdmin ? '/api/trucks' : null);
  const trailers = useApiResource(isAuthenticated && isAdmin ? '/api/trailers' : null);
  const users = useApiResource(isAuthenticated && isAdmin ? '/api/users' : null);
  const assignments = useApiResource(isAuthenticated ? '/api/assignments' : null);
  const customers = useApiResource(
    isAuthenticated && (isAdmin || isDispatcher) ? '/api/customers' : null
  );
  const zones = useApiResource(
    isAuthenticated && (isAdmin || isDispatcher) ? '/api/zones' : null
  );
  const surcharges = useApiResource(isAuthenticated && isAdmin ? '/api/surcharge-types' : null);
  const invoices = useApiResource(isAuthenticated && isAdmin ? '/api/invoices' : null);
  const runs = useApiResource(isAuthenticated ? '/api/runs' : null, { initialFetch: false });

  // 📦 Zasoby (hook-safe)
  const resources = {
    orders,
    drivers,
    trucks,
    trailers,
    users,
    assignments,
    customers,
    zones,
    surcharges,
    invoices,
    runs,
  };

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
  const data = useMemo(() => {
    const result = {};
    for (const [key, resource] of Object.entries(resources)) {
      result[key] = resource.data || [];
    }
    return result;
  }, [resources]);

  /** Nowy, stabilniejszy stan ładowania */
  const isLoading = useMemo(
    () => Object.values(resources).some((r) => r.isLoading && !r.data),
    [resources]
  );

  const anyError = useMemo(
    () => Object.values(resources).find((r) => r.error)?.error ?? null,
    [resources]
  );

  /** Akcje CRUD przypięte do każdego zasobu */
  const actions = useMemo(() => {
    const result = {};
    for (const [key, res] of Object.entries(resources)) {
      result[key] = {
        create: res.createResource,
        update: res.updateResource,
        delete: res.deleteResource,
        bulkCreate: res.bulkCreate,
      };
    }
    return result;
  }, [resources]);

  return {
    data,
    isLoading,
    anyError,
    handleRefresh,
    refreshAll,
    actions,
  };
};
