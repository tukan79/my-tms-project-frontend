// src/hooks/useApiResource.js
import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '@/services/api';

/**
 * Solidny hook do CRUD + fetch + optimistic updates.
 */
export const useApiResource = (
  resourceUrl, // np. /api/orders
  options,
  resourceName = 'resource',
  initialData = [],
) => {
  const safeOptions = options ?? { initialFetch: true };
  const enabled = Boolean(resourceUrl);

  const [data, setData] = useState(Array.isArray(initialData) ? initialData : []);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // refs to keep stable access inside callbacks
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const setDataRef = useRef((v) => setData(v));
  useEffect(() => { setDataRef.current = setData; }, [setData]);

  const resourceUrlRef = useRef(resourceUrl);
  const resourceNameRef = useRef(resourceName);
  const optionsRef = useRef(safeOptions);
  const abortControllerRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    resourceUrlRef.current = resourceUrl;
    resourceNameRef.current = resourceName;
    optionsRef.current = safeOptions;
    // When resourceUrl changes, reset lastFetched so that a new fetch is allowed
    setLastFetched(null);
  }, [resourceUrl, resourceName, safeOptions]);

  const isCancelError = (err) => axios.isCancel?.(err) || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';

  // Robust parser for different API shapes
  const parseResponseData = (rawData) => {
    if (!rawData) return [];
    const commonKeys = ['data', 'results', 'items', 'rows'];
    for (const k of commonKeys) {
      if (Array.isArray(rawData[k])) return rawData[k];
    }
    const plural = resourceNameRef.current + 's';
    if (Array.isArray(rawData[plural])) return rawData[plural];
    if (Array.isArray(rawData)) return rawData;
    if (typeof rawData === 'object') {
      for (const key in rawData) {
        if (Array.isArray(rawData[key])) return rawData[key];
      }
    }
    return [];
  };

  // FETCH
  const fetchData = useCallback(async (params = {}) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;

    if (!currentUrl) return null; // safety: do nothing when disabled

    if (inFlightRef.current) {
      // Avoid duplicate fetches while one is in-flight
      return dataRef.current || null;
    }
    inFlightRef.current = true;

    // abort previous
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) { console.error('Abort previous request failed', e); }
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetching(true);
    setError(null);

    try {
      const response = await api.get(currentUrl, { params, signal: controller.signal });
      const processed = parseResponseData(response.data);
      setDataRef.current(processed);
      setLastFetched(Date.now());
      return processed;
    } catch (err) {
      if (isCancelError(err)) {
        // request was canceled (not an application error)
        return null;
      }
      console.error(`fetchData error for ${currentName}:`, err);
      setError(err.response?.data?.error || `Failed to fetch ${currentName}.`);
      setDataRef.current([]);
      // Prevent immediate retry loops: set lastFetched so the auto-fetch effect doesn't refire instantly
      setLastFetched(Date.now());
      // optional: small delay to avoid spamming caller
      await new Promise((res) => setTimeout(res, 50));
      return null;
    } finally {
      inFlightRef.current = false;
      setIsFetching(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  // auto-fetch (controlled by options.initialFetch)
  useEffect(() => {
    const shouldInitialFetch = Boolean(optionsRef.current?.initialFetch);
    if (!enabled) {
      setData([]); // ensure cleared when endpoint not present
      return;
    }
    if (enabled && shouldInitialFetch && !lastFetched) {
      // schedule fetch (no double-calling if parent also triggers)
      fetchData();
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [enabled, lastFetched, fetchData]);

  // deep clone helper (structuredClone where available)
  const deepClone = (obj) => {
    try {
      if (typeof structuredClone === 'function') return structuredClone(obj);
    } catch (e) {
      console.error('structuredClone failed', e);
    }
    return obj;
  };

  // CREATE
  const createResource = useCallback(async (resourceData, optimisticFn) => {
    const currentUrl = resourceUrlRef.current;
    const { autoRefetch = false } = optionsRef.current;
    const currentName = resourceNameRef.current;
    if (!currentUrl) throw new Error(`createResource: resource ${currentName} not enabled`);

    let tempId = null;
    if (typeof optimisticFn === 'function') {
      tempId = `tmp-${Date.now()}`;
      const optimisticItem = optimisticFn(resourceData, tempId);
      setDataRef.current((prev) => Array.isArray(prev) ? [...prev, optimisticItem] : [optimisticItem]);
    }

    setIsMutating(true);
    setError(null);

    try {
      const resp = await api.post(currentUrl, resourceData);
      const created = Array.isArray(resp.data) ? resp.data[0] : resp.data;
      setDataRef.current((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        if (typeof optimisticFn === 'function') {
          return current.map((it) => (it.id === tempId ? created : it));
        }
        return [...current, created];
      });
      if (autoRefetch) {
        await fetchData();
      }
      return created;
    } catch (err) {
      console.error(`createResource error for ${currentName}:`, err);
      if (typeof optimisticFn === 'function') {
        setDataRef.current((prev) => (Array.isArray(prev) ? prev.filter((i) => i.id !== tempId) : []));
      }
      setError(err.response?.data?.error || `Failed to create ${currentName}.`);
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // UPDATE
  const updateResource = useCallback(async (id, updates) => {
    const currentUrl = resourceUrlRef.current;
    const { autoRefetch = false } = optionsRef.current;
    const currentName = resourceNameRef.current;
    if (!currentUrl) throw new Error(`updateResource: resource ${currentName} not enabled`);

    const previousState = deepClone(dataRef.current || []);
    // optimistic local update
    setDataRef.current((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === id ? { ...item, ...updates } : item)) : prev));

    setIsMutating(true);
    setError(null);

    try {
      const resp = await api.put(`${currentUrl}/${id}`, updates);
      const updated = resp.data;
      setDataRef.current((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === id ? updated : item)) : prev));
      if (autoRefetch) {
        await fetchData();
      }
      return updated;
    } catch (err) {
      console.error(`updateResource error for ${currentName}:`, err);
      // rollback
      setDataRef.current(previousState);
      setError(err.response?.data?.error || `Failed to update ${currentName}.`);
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // DELETE
  const deleteResource = useCallback(async (id) => {
    const currentUrl = resourceUrlRef.current;
    const { autoRefetch = false } = optionsRef.current;
    const currentName = resourceNameRef.current;
    if (!currentUrl) throw new Error(`deleteResource: resource ${currentName} not enabled`);

    const previousState = deepClone(dataRef.current || []);
    setDataRef.current((prev) => (Array.isArray(prev) ? prev.filter((i) => i.id !== id) : prev));

    setIsMutating(true);
    setError(null);

    try {
      await api.delete(`${currentUrl}/${id}`);
      if (autoRefetch) {
        await fetchData();
      }
      return true;
    } catch (err) {
      console.error(`deleteResource error for ${currentName}:`, err);
      setDataRef.current(previousState);
      setError(err.response?.data?.error || `Failed to delete ${currentName}.`);
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  // BULK CREATE
  const bulkCreate = useCallback(async (payload) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;
    if (!currentUrl) throw new Error(`bulkCreate: resource ${currentName} not enabled`);

    setIsMutating(true);
    setError(null);
    try {
      const resp = await api.post(`${currentUrl}/bulk`, payload);
      // re-fetch to ensure canonical state
      await fetchData();
      return { success: true, message: resp.data?.message || `${currentName} created successfully.` };
    } catch (err) {
      console.error(`bulkCreate error for ${currentName}:`, err);
      setError(err.response?.data?.error || `Failed to bulk create ${currentName}.`);
      return { success: false, message: err.response?.data?.error || 'Bulk create failed' };
    } finally {
      setIsMutating(false);
    }
  }, [fetchData]);

  const stableSetData = useCallback((newData) => {
    setData(Array.isArray(newData) ? newData : []);
  }, []);

  return {
    // state
    data,
    isFetching,
    isMutating,
    error,
    lastFetched,
    enabled, // important: indicates whether this resource has an endpoint
    // actions
    fetchData,
    createResource,
    updateResource,
    deleteResource,
    bulkCreate,
    setData: stableSetData,
  };
};
