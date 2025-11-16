// src/hooks/useDashboard.js
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useApiResource } from '@/hooks/useApiResource.js';

/**
 * useDataFetching (useDashboard) — orchestrator dla wszystkich zasobów dashboardu.
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

  // Initialize resources (always at top level). We pass initialFetch: false — dashboard controls fetching.
  const ordersResource = useApiResource(userRole === 'admin' ? endpoints.orders : null, 'order', [], { initialFetch: false });
  const driversResource = useApiResource(userRole === 'admin' ? endpoints.drivers : null, 'driver', [], { initialFetch: false });
  const trucksResource = useApiResource(userRole === 'admin' ? endpoints.trucks : null, 'truck', [], { initialFetch: false });
  const trailersResource = useApiResource(userRole === 'admin' ? endpoints.trailers : null, 'trailer', [], { initialFetch: false });
  const usersResource = useApiResource(userRole === 'admin' ? endpoints.users : null, 'user', [], { initialFetch: false });
  const surchargesResource = useApiResource(userRole === 'admin' ? endpoints.surcharges : null, 'surcharge', [], { initialFetch: false });
  const invoicesResource = useApiResource(userRole === 'admin' ? endpoints.invoices : null, 'invoice', [], { initialFetch: false });

  // Non-admin resources (available to all authenticated roles)
  const assignmentsResource = useApiResource(userRole ? endpoints.assignments : null, 'assignment', [], { initialFetch: false });
  const customersResource = useApiResource(userRole ? endpoints.customers : null, 'customer', [], { initialFetch: false });
  const zonesResource = useApiResource(userRole ? endpoints.zones : null, 'zone', [], { initialFetch: false });
  const runsResource = useApiResource(userRole ? endpoints.runs : null, 'run', [], { initialFetch: false });

  // Array & map for convenience
  const resources = useMemo(() => [
    { key: 'orders', res: ordersResource },
    { key: 'drivers', res: driversResource },
    { key: 'trucks', res: trucksResource },
    { key: 'trailers', res: trailersResource },
    { key: 'users', res: usersResource },
    { key: 'surcharges', res: surchargesResource },
    { key: 'invoices', res: invoicesResource },
    { key: 'assignments', res: assignmentsResource },
    { key: 'customers', res: customersResource },
    { key: 'zones', res: zonesResource },
    { key: 'runs', res: runsResource },
  ], []);

  const resourcesMap = useMemo(() => Object.fromEntries(resources.map(({ key, res }) => [key, res])), [resources]);

  // Refs to avoid duplicate initial fetch in StrictMode and reentrancy
  const initialFetchPromiseRef = useRef(null);
  const fetchAllRunningRef = useRef(false);
  const isRefreshing = useRef(false);

  // Fetch sequentially but only for enabled resources that haven't been fetched yet.
  const fetchAllSequentially = useCallback(async (opts = { delayMs: 120, filterKeys: null }) => {
    if (fetchAllRunningRef.current) {
      console.log('🔄 fetchAllSequentially already running — skipping.');
      return;
    }
    fetchAllRunningRef.current = true;
    console.log('🔄 Sequentially fetching dashboard data...', opts);
    try {
      const list = opts.filterKeys
        ? resources.filter(r => opts.filterKeys.includes(r.key))
        : resources;
      for (const { key, res } of list) {
        if (!res || !res.enabled) continue; // skip disabled
        // if already fetched recently, skip
        if (res.lastFetched && !res.error) continue;
        if (typeof res.fetchData !== 'function') continue;

        try {
          await res.fetchData();
          if (opts.delayMs) await new Promise((s) => setTimeout(s, opts.delayMs));
        } catch (e) {
          console.error(`Failed to fetch resource ${key}:`, e);
        }
      }
      console.log('✅ Sequential fetch complete.');
    } finally {
      fetchAllRunningRef.current = false;
    }
  }, [resources]);

  // Optionally fetch multiple in parallel (faster for non-dependent resources)
  const fetchParallel = useCallback(async (keys = null) => {
    if (isRefreshing.current) {
      console.log('🔄 fetchParallel skipped - refresh in progress');
      return;
    }
    const list = keys ? keys.map(k => resourcesMap[k]).filter(Boolean) : resources.map(r => r.res).filter(Boolean);
    const enabledList = list.filter((r) => r && r.enabled && typeof r.fetchData === 'function');
    if (enabledList.length === 0) return;
    isRefreshing.current = true;
    try {
      // use allSettled to avoid unhandled rejections and continue other requests
      const promises = enabledList.map((r) => r.fetchData());
      await Promise.allSettled(promises);
    } finally {
      // small delay to avoid immediate reentry
      setTimeout(() => { isRefreshing.current = false; }, 400);
    }
  }, [resources, resourcesMap]);

  // Refresh helpers
  const refreshAll = useCallback(async (opts) => {
    if (isRefreshing.current) return;
    return fetchParallel();
  }, [fetchParallel]);

  const handleRefresh = useCallback(async (viewKey) => {
    if (!viewKey) return;
    const res = resourcesMap[viewKey];
    if (!res || !res.enabled) return;
    if (typeof res.fetchData === 'function') {
      if (isRefreshing.current) return;
      isRefreshing.current = true;
      try {
        await res.fetchData();
      } catch (e) {
        console.error(`handleRefresh failed for ${viewKey}:`, e);
      } finally {
        setTimeout(() => {
          isRefreshing.current = false;
        }, 200);
      }
    }
  }, [resourcesMap]);

  // Initial fetch: once when userRole appears (and only if not already done)
  useEffect(() => {
    if (!userRole) return;
    if (initialFetchPromiseRef.current) {
      // already running/ran
      return;
    }

    initialFetchPromiseRef.current = (async () => {
      try {
        // first fetch essential resources (parallel), then heavier ones sequentially
        await fetchParallel(['runs', 'assignments', 'customers']);
        await fetchAllSequentially({ delayMs: 120 });
      } catch (e) {
        console.error('Initial data fetch error:', e);
      } finally {
        // keep the promise ref so we don't re-run initial fetch in StrictMode
      }
    })();

    // no cleanup necessary here — the promise ref prevents re-run
  }, [userRole, fetchAllSequentially, fetchParallel]);

  // Reset resources when userRole changes (e.g., logout/login different user)
  useEffect(() => {
    // Clear data and lastFetched of resources that are no longer enabled
    for (const { key, res } of resources) {
      if (!res) continue;
      if (!res.enabled) {
        // clear stale data
        try { res.setData([]); } catch (e) { /* ignore */ }
      }
      res.setData([]);
      res.lastFetched = null;
    }
    // allow new initial fetch for changed role
    initialFetchPromiseRef.current = null;
  }, [userRole, resources]);

  // Derived data + status
  const data = useMemo(() => Object.fromEntries(
    Object.entries(resourcesMap).map(([key, r]) => [key, Array.isArray(r?.data) ? r.data : []])
  ), [resourcesMap]);

  const isLoading = useMemo(() => resources.some(({ res }) => res?.isFetching || res?.isMutating), [resources]);

  const anyError = useMemo(() => {
    const found = resources.find(({ res }) => res?.error);
    return found?.res?.error || null;
  }, [resources]);

  const actions = useMemo(() => Object.fromEntries(
    Object.entries(resourcesMap).map(([key, res]) => [
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
  ), [resourcesMap]);

  return {
    data,
    isLoading,
    anyError,
    handleRefresh,
    refreshAll,
    actions,
    _internal: { resources, resourcesMap },
  };
};
// src/hooks/useDashboard.js