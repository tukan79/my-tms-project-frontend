import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/services/api';

/**
 * Uniwersalny hook do zarządzania danymi API z wbudowaną obsługą CRUD, 
 * optymistycznymi aktualizacjami i bezpieczeństwem przed race conditions.
 */
export const useApiResource = (
  resourceUrl,
  resourceName = 'resource',
  initialData = [],
  options = { initialFetch: true }
) => {
  const [data, setData] = useState(initialData); // zawsze tablica
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // ref, aby uniknąć problemu z nieaktualnymi wartościami
  const setDataRef = useRef(setData);
  useEffect(() => {
    setDataRef.current = setData;
  }, []);


  const resourceUrlRef = useRef(resourceUrl);
  const resourceNameRef = useRef(resourceName);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    resourceUrlRef.current = resourceUrl;
    resourceNameRef.current = resourceName;
  }, [resourceUrl, resourceName]);

  /**
   * Pobiera dane z API (bez efektów ubocznych w zależnościach).
   * Chroni przed sytuacją, gdy starsza odpowiedź nadpisze nowsze dane.
   */
  const fetchData = useCallback(async () => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;
    if (!currentUrl) return;

    // Anuluj poprzednie żądanie (jeśli trwa)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(currentUrl, { signal: controller.signal });
      const rawData = response.data;
      let processedData = [];

      // Handle different API response structures:
      // 1. If data is wrapped in a key matching the pluralized resource name (e.g., { users: [...] })
      // 2. If data is wrapped in a generic 'data' key (e.g., { data: [...] })
      // 3. If data is directly an array
      if (rawData) {
        const pluralResourceName = resourceName + 's'; // e.g., 'users' from 'user'
        if (rawData[pluralResourceName] && Array.isArray(rawData[pluralResourceName])) {
          processedData = rawData[pluralResourceName];
        } else if (rawData.data && Array.isArray(rawData.data)) {
          processedData = rawData.data;
        } else if (Array.isArray(rawData)) {
          processedData = rawData;
        }
      }
      setDataRef.current(processedData);
      setLastFetched(Date.now());
      return processedData;
    } catch (err) {
      if (err.name === 'CanceledError') return; // żądanie anulowane
      const errorMessage = err.response?.data?.error || `Failed to fetch ${currentName}.`;
      setError(errorMessage);
      setDataRef.current([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Automatycznie pobiera dane przy zmianie adresu.
   */
  useEffect(() => {
    if (resourceUrl && options.initialFetch && !lastFetched) {
      fetchData();
    } else {
      setData([]);
    }
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [resourceUrl, options.initialFetch, lastFetched, fetchData]);

  /**
   * Tworzy nowy rekord z opcjonalnym optymistycznym UI.
   */
  const createResource = useCallback(async (resourceData, optimisticUpdate) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;

    let tempId = null;
    if (optimisticUpdate) {
      tempId = `temp-${Date.now()}`;
      const optimisticItem = optimisticUpdate(resourceData, tempId);
      setDataRef.current((prev) => [...prev, optimisticItem]);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(currentUrl, resourceData);
      const newItem = response.data;

      setDataRef.current((prev) =>
        optimisticUpdate
          ? prev.map((item) => (item.id === tempId ? newItem : item))
          : [...prev, newItem]
      );

      return newItem;
    } catch (err) {
      if (optimisticUpdate) {
        setDataRef.current((prev) => prev.filter((i) => i.id !== tempId));
      }
      const errorMessage = err.response?.data?.error || `Failed to create ${currentName}.`;
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Aktualizuje istniejący rekord z rollbackiem przy błędzie.
   */
  const updateResource = useCallback(async (id, updates) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;

    let previousState;
    setDataRef.current((prev) => {
      previousState = prev;
      return prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
    });

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put(`${currentUrl}/${id}`, updates);
      const updatedItem = response.data;
      setDataRef.current((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      return updatedItem;
    } catch (err) {
      if (previousState) setDataRef.current(previousState);
      const errorMessage = err.response?.data?.error || `Failed to update ${currentName}.`;
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Usuwa rekord z rollbackiem przy błędzie.
   */
  const deleteResource = useCallback(async (id) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;

    let deletedItem = null;
    setDataRef.current((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      if (index === -1) return prev;
      deletedItem = prev[index];
      return prev.filter((i) => i.id !== id);
    });

    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`${currentUrl}/${id}`);
    } catch (err) {
      if (deletedItem) {
        setDataRef.current((prev) => [...prev, deletedItem]);
      }
      const errorMessage = err.response?.data?.error || `Failed to delete ${currentName}.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Tworzy wiele rekordów (bulk create).
   */
  const bulkCreate = useCallback(async (payload) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`${currentUrl}/bulk`, payload);
      await fetchData(); // refetch po bulk-create
      return { success: true, message: response.data.message || `${currentName} created successfully.` };
    } catch (err) {
      const errorMessage = err.response?.data?.error || `Failed to bulk create ${currentName}.`;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  /**
   * Stabilna funkcja setData — np. dla ręcznego modyfikowania listy.
   */
  const stableSetData = useCallback((newData) => {
    setData(Array.isArray(newData) ? newData : []);
  }, []);

  return {
    data,
    isLoading,
    error,
    lastFetched,
    fetchData,
    createResource,
    updateResource,
    deleteResource,
    bulkCreate,
    setData: stableSetData,
  };
};

// ostatnia zmiana (04.11.2025, 20:25:00)
