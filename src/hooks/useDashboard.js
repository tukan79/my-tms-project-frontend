// src/hooks/useDashboard.js
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useApiResource } from '@/hooks/useApiResource.js';

/**
 * FIXED VERSION — Render Safe & No Infinite Fetch Loop
 */
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

  // Create resources — STATIC, NOT CHANGING
  const resources = useMemo(() => {
    return [
      { key: 'orders', res: useApiResource(userRole === 'admin' ? endpoints.orders : null, 'order', [], { initialFetch: false }) },
      { key: 'drivers', res: useApiResource(userRole === 'admin' ? endpoints.drivers : null, 'driver', [], { initialFetch: false }) },
      { key: 'trucks', res: useApiResource(userRole === 'admin' ? endpoints.trucks : null, 'truck', [], { initialFetch: false }) },
      { key: 'trailers', res: useApiResource(userRole === 'admin' ? endpoints.trailers : null, 'trailer', [], { initialFetch: false }) },
      { key: 'users', res: useApiResource(userRole === 'admin' ? endpoints.users : null, 'user', [], { initialFetch: false }) },
      { key: 'surcharges', res: useApiResource(userRole === 'admin' ? endpoints.surcharges : null, 'surcharge', [], { initialFetch: false }) },
      { key: 'invoices', res: useApiResource(userRole === 'admin' ? endpoints.invoices : null, 'invoice', [], { initialFetch: false }) },

      // non-admin
      { key: 'assignments', res: useApiResource(userRole ? endpoints.assignments : null, 'assignment', [], { initialFetch: false }) },
      { key: 'customers', res: useApiResource(userRole ? endpoints.customers : null, 'customer', [], { initialFetch: false }) },
      { key: 'zones', res: useApiResource(userRole ? endpoints.zones : null, 'zone', [], { initialFetch: false }) },
      { key: 'runs', res: useApiResource(userRole ? endpoints.runs : null, 'run', [], { initialFetch: false }) },
    ];
  }, [userRole]);

  const resourcesMap = useMemo(
    () => Object.fromEntries(resources.map(({ key, res }) => [key, res])),
    [resources]
  );

  const initialFetchDoneRef = useRef(false);
  const isRefreshing = useRef(false);

  /** SEQUENTIAL FETCH (fixed: NEVER repeats, stable refs) */
  const fetchAllSequentially = useCallback(async () => {
    if (isRefreshing.current) return;

    isRefreshing.current = true;

    console.log('🔄 [Dashboard] Sequential fetch start');

    for (const { key, res } of resources) {
      if (!res?.enabled) continue;
      if (res.lastFetched) continue;
      try {
        await res.fetchData();
      } catch (e) {
        console.error(`❌ fetch error for ${key}`, e);
      }
      await new Promise(r => setTimeout(r, 80));
    }

    console.log('✅ [Dashboard] Sequential fetch complete');

    setTimeout(() => (isRefreshing.current = false), 500);
  }, [resources]);

  /** PARALLEL FETCH */
  const fetchParallel = useCallback(async () => {
    const list = resources
      .filter(r => r.res?.enabled)
      .map(r => r.res.fetchData);

    await Promise.all(list.map(fn => fn()));
  }, [resources]);

  /** INITIAL FETCH — runs ONLY ONCE per login */
  useEffect(() => {
    if (!userRole) return;
    if (initialFetchDoneRef.current) return;

    initialFetchDoneRef.current = true;

    (async () => {
      console.log('🚀 Initial dashboard fetch');

      // Fast minimal set
      await fetchParallel();

      // Then rest, slow sequential (safe for Render)
      await fetchAllSequentially();
    })();
  }, [userRole, fetchParallel, fetchAllSequentially]);

  /** Refresh specific view */
  const handleRefresh = useCallback(async (viewKey) => {
    const res = resourcesMap[viewKey];
    if (!res?.enabled || !res.fetchData) return;

    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      await res.fetchData();
    } finally {
      setTimeout(() => (isRefreshing.current = false), 400);
    }
  }, [resourcesMap]);

  /** Refresh ALL resources */
  const refreshAll = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      await fetchParallel();
    } finally {
      setTimeout(() => (isRefreshing.current = false), 500);
    }
  }, [fetchParallel]);

  /** Derived data */
  const data = useMemo(() => {
    return Object.fromEntries(
      resources.map(({ key, res }) => [key, Array.isArray(res.data) ? res.data : []])
    );
  }, [resources]);

  const isLoading = useMemo(
    () => resources.some(r => r.res?.isFetching || r.res?.isMutating),
    [resources]
  );

  const anyError = useMemo(
    () => resources.find(r => r.res?.error)?.res?.error || null,
    [resources]
  );

  const actions = useMemo(
    () => Object.fromEntries(
      resources.map(({ key, res }) => [
        key,
        {
          create: res?.createResource,
          update: res?.updateResource,
          delete: res?.deleteResource,
          fetchData: res?.fetchData,
          enabled: res?.enabled,
          setData: res?.setData
        }
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
