import { useMemo, useCallback, useEffect } from 'react';
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
    orders: useApiResource(userRole ? endpoints.orders : null, 'order', [], { initialFetch: false }),
    drivers: useApiResource(userRole === 'admin' ? endpoints.drivers : null, 'driver', [], { initialFetch: false }),
    trucks: useApiResource(userRole === 'admin' ? endpoints.trucks : null, 'truck', [], { initialFetch: false }),
    trailers: useApiResource(userRole === 'admin' ? endpoints.trailers : null, 'trailer', [], { initialFetch: false }),
    users: useApiResource(userRole === 'admin' ? endpoints.users : null, 'user', [], { initialFetch: false }),
    assignments: useApiResource(userRole ? endpoints.assignments : null, 'assignment', [], { initialFetch: false }),
    customers: useApiResource(userRole ? endpoints.customers : null, 'customer', [], { initialFetch: false }),
    zones: useApiResource(userRole ? endpoints.zones : null, 'zone', [], { initialFetch: false }),
    surcharges: useApiResource(userRole === 'admin' ? endpoints.surcharges : null, 'surcharge', [], { initialFetch: false }),
    invoices: useApiResource(userRole === 'admin' ? endpoints.invoices : null, 'invoice', [], { initialFetch: false }),
    runs: useApiResource(userRole ? endpoints.runs : null, 'run', [], { initialFetch: false }),
  };

  const fetchAllSequentially = useCallback(async () => {
    console.log('🔄 Sequentially fetching all dashboard data...');
    // Fetch data one by one to avoid rate limiting
    for (const resource of Object.values(resources)) {
      // The fetchData function is memoized inside useApiResource
      if (resource.fetchData) {
        await resource.fetchData();
      }
    }
    console.log('✅ Sequential fetch complete.');
  }, []); // Dependencies are stable due to useApiResource

  const refreshAll = useCallback(async () => {
    await fetchAllSequentially();
  }, [fetchAllSequentially]);

  // Trigger initial fetch when userRole changes
  useEffect(() => {
    if (userRole) {
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