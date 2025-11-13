import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useApiResource } from '@/hooks/useApiResource.js';

export const useDataFetching = (userRole) => {
  const endpoints = {
    orders: '/api/orders',
    drivers: '/api/drivers',
    trucks: '/api/trucks',
    trailers: '/api/trailers',
    users: '/api/users',
    assignments: '/api/assignments',
    customers: '/api/customers',
    zones: '/api/zones',
    surcharges: '/api/surcharge-types',
    invoices: '/api/invoices',
    runs: '/api/runs',
  };

  const resources = {
    // Orders are fetched ONLY for admin. Dispatcher does not have backend permissions.
    // This prevents 403 Forbidden errors and forced logouts for the dispatcher role.
    orders: useApiResource(userRole === 'admin' ? endpoints.orders : null, 'order', [], { initialFetch: false }),
    drivers: useApiResource(userRole === 'admin' ? endpoints.drivers : null, 'driver', [], { initialFetch: false }),
    trucks: useApiResource(userRole === 'admin' ? endpoints.trucks : null, 'truck', [], { initialFetch: false }),
    trailers: useApiResource(userRole === 'admin' ? endpoints.trailers : null, 'trailer', [], { initialFetch: false }),
    users: useApiResource(userRole === 'admin' ? endpoints.users : null, 'user', [], { initialFetch: false }),
    surcharges: useApiResource(userRole === 'admin' ? endpoints.surcharges : null, 'surcharge', [], { initialFetch: false }),
    invoices: useApiResource(userRole === 'admin' ? endpoints.invoices : null, 'invoice', [], { initialFetch: false }),
    assignments: useApiResource(userRole ? endpoints.assignments : null, 'assignment', [], { initialFetch: false }),
    customers: useApiResource(userRole ? endpoints.customers : null, 'customer', [], { initialFetch: false }),
    zones: useApiResource(userRole ? endpoints.zones : null, 'zone', [], { initialFetch: false }),
    runs: useApiResource(userRole ? endpoints.runs : null, 'run', [], { initialFetch: false }),
  };

  const initialFetchDoneRef = useRef(false);

  const fetchAllSequentially = useCallback(async () => {
    console.log('🔄 Sequentially fetching all dashboard data...');
    const resourceList = Object.values(resources);

    for (let i = 0; i < resourceList.length; i++) {
      const resource = resourceList[i];
      // Pobieraj dane tylko, jeśli nie były jeszcze pobierane
      if (resource.fetchData && resource.lastFetched === null) {
        await resource.fetchData();
        // Dodaj małe opóźnienie, aby uniknąć błędów "rate limiting" (429)
        if (i < resourceList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }
    }
    console.log('✅ Sequential fetch complete.');
  }, [resources]); // Dodajemy `resources` jako zależność

  const refreshAll = useCallback(async () => {
    await fetchAllSequentially();
  }, [fetchAllSequentially]);

  // Trigger initial fetch only once when userRole is first available
  useEffect(() => {
    // Zapobiegamy podwójnemu wywołaniu w React.StrictMode
    if (userRole && !initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchAllSequentially();
    }
  }, [userRole, fetchAllSequentially]);

  const data = useMemo(() => 
    Object.fromEntries(Object.entries(resources).map(([key, res]) => [key, res.data]))
  , [resources]);

  const isLoading = useMemo(() => 
    Object.values(resources).some(res => res.isLoading)
  , [resources]);

  const anyError = useMemo(() => 
    Object.values(resources).find(res => res.error)?.error
  , [resources]);

  const actions = useMemo(() => Object.fromEntries(Object.entries(resources).map(([key, res]) => [key, { create: res.createResource, update: res.updateResource, delete: res.deleteResource }])), [resources]);

  return { data, isLoading, anyError, handleRefresh: (view) => resources[view]?.fetchData(), refreshAll, actions };
};