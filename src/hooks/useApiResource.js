// src/hooks/useApiResource.js
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/services/api";
import axios from "axios";

/**
 * 100% reliable parser:
 * Finds the **best matching array** inside ANY response shape.
 */
const parseResponseData = (rawData, resourceKey) => {
  const toArray = (val) => {
    if (Array.isArray(val)) return val;
    return val == null ? null : [val];
  };

  const tryKnownKey = (obj, key) => {
    if (!obj || typeof obj !== "object" || !key) return null;
    const norm = key.toLowerCase();
    const candidates = [norm, `${norm}s`];
    for (const candidate of candidates) {
      const arr = toArray(obj[candidate]);
      if (arr) return arr;
    }
    return null;
  };

  const findArraysDeep = (obj, path = []) => {
    if (!obj || typeof obj !== "object") return [];

    let found = [];
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (Array.isArray(val)) {
        found.push({ key, path: [...path, key], array: val });
        continue;
      }
      if (typeof val === "object") {
        found.push(...findArraysDeep(val, [...path, key]));
      }
    }
    return found;
  };

  const selectByResourceKey = (arrays, key) => {
    if (!key) return null;
    const norm = key.toLowerCase();
    const exact = arrays.find((a) => a.key.toLowerCase() === norm);
    if (exact) return exact.array;

    const plural = arrays.find((a) => a.key.toLowerCase() === `${norm}s`);
    if (plural) return plural.array;

    const fuzzy = arrays.find((a) => a.key.toLowerCase().includes(norm));
    return fuzzy ? fuzzy.array : null;
  };

  if (!rawData) return [];

  if (Array.isArray(rawData)) return rawData;

  const byKnownKey = tryKnownKey(rawData, resourceKey);
  if (byKnownKey) return byKnownKey;

  const arrays = findArraysDeep(rawData);
  if (arrays.length === 0) return [];

  const byResourceKey = selectByResourceKey(arrays, resourceKey);
  if (byResourceKey) return byResourceKey;

  if (arrays.length === 1) return arrays[0].array;

  const shallowest = arrays.reduce((a, b) =>
    a.path.length <= b.path.length ? a : b
  );
  return shallowest.array;
};

/**
 * Extract resource key from URL: /api/zones -> zones
 */
const deriveResourceKey = (url = "") => {
  const cleaned = url.split("?")[0];
  const parts = cleaned.split("/").filter(Boolean);
  if (!parts.length) return null;
  const lastPart = parts.at(-1);
  return lastPart || null;
};

export const useApiResource = (
  resourceUrl,
  { enabled = true, initialFetch = true, autoRefetch = false } = {},
  resourceName
) => {
  const [data, setData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  // Auto resource key
  const resourceKey = resourceName || deriveResourceKey(resourceUrl);

  /**
   * Cancel any previous request
   */
  const cancelPrevious = () => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (e) {
        console.warn("Abort failed", e);
      }
    }
  };

  /**
   * FETCH
   */
  const fetchData = useCallback(
    async (params = {}) => {
      if (!enabled || !resourceUrl) return;

      cancelPrevious();

      const controller = new AbortController();
      abortRef.current = controller;

      setIsFetching(true);
      setError(null);

      try {
        const resp = await api.get(resourceUrl, {
          params,
          signal: controller.signal,
        });

        const processed = parseResponseData(resp.data, resourceKey);
        setData(processed || []);

        return processed;
      } catch (err) {
        if (axios.isCancel(err)) return;

        console.error(`❌ Fetch error for ${resourceKey}:`, err);
        setError(err.response?.data?.error || "Failed to fetch data");
        setData([]);
        return null;
      } finally {
        setIsFetching(false);
      }
    },
    [resourceUrl, enabled, resourceKey]
  );

  /**
   * AUTO FETCH on mount / URL change
   */
  useEffect(() => {
    if (initialFetch && enabled) {
      fetchData();
    }
    return cancelPrevious;
  }, [fetchData, initialFetch, enabled]);

  /**
   * CREATE
   */
  const createResource = useCallback(
    async (payload, optimisticBuilder) => {
      if (!resourceUrl) return;

      let tmpId = null;

      // Optimistic insert
      if (optimisticBuilder) {
        tmpId = "tmp-" + Date.now();
        const optimisticItem = optimisticBuilder(payload, tmpId);

        setData((prev) => [...prev, optimisticItem]);
      }

      setIsMutating(true);
      setError(null);

      try {
        const resp = await api.post(resourceUrl, payload);

        const parsed = parseResponseData(resp?.data, resourceKey);
        const created = parsed?.[0] ?? resp?.data ?? null;

        if (optimisticBuilder) {
          // replace temp with real item
          setData((prev) =>
            prev.map((i) => (i.id === tmpId ? created : i))
          );
        } else {
          setData((prev) => [...prev, created]);
        }

        if (autoRefetch) fetchData();

        return created;
      } catch (err) {
        console.error(`❌ Create error for ${resourceKey}:`, err);
        setError(err.response?.data?.error || "Failed to create");

        if (optimisticBuilder) {
          // rollback
          setData((prev) => prev.filter((i) => i.id !== tmpId));
        }

        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [resourceUrl, autoRefetch, fetchData, resourceKey]
  );

  /**
   * UPDATE
   */
  const updateResource = useCallback(
    async (id, changes) => {
      if (!resourceUrl) return;

      const prev = [...data];

      // optimistically apply
      setData((curr) =>
        curr.map((i) => (i.id === id ? { ...i, ...changes } : i))
      );

      setIsMutating(true);
      setError(null);

      try {
        const resp = await api.put(`${resourceUrl}/${id}`, changes);
        const parsed = parseResponseData(resp?.data, resourceKey);
        const updated = parsed?.[0] ?? resp?.data ?? null;

        setData((curr) =>
          curr.map((i) =>
            i.id === id ? { ...i, ...(updated ?? changes) } : i
          )
        );

        if (autoRefetch) fetchData();

        return updated;
      } catch (err) {
        console.error(`❌ Update error for ${resourceKey}:`, err);
        setError(err.response?.data?.error || "Failed to update");

        setData(prev); // rollback
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [resourceUrl, data, autoRefetch, fetchData, resourceKey]
  );

  /**
   * DELETE
   */
  const deleteResource = useCallback(
    async (id, { autoRefetch: refetch = autoRefetch } = {}) => {
      if (!resourceUrl) return null;

      const previousData = Array.isArray(data) ? [...data] : [];

      // optymistyczne usunięcie z listy
      setData((curr) => curr.filter((item) => item?.id !== id));

      try {
        setIsMutating(true);
        setError(null);

        const resp = await api.delete(`${resourceUrl}/${id}`);
        const parsed = parseResponseData(resp?.data, resourceKey);
        const deletedItem = parsed?.[0] ?? resp?.data ?? null;

        if (refetch) fetchData();
        return deletedItem;
      } catch (err) {
        console.error(`❌ Delete error for ${resourceKey}:`, err);
        setError(err?.response?.data?.error || "Failed to delete");
        setData(previousData); // rollback danych
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [resourceUrl, autoRefetch, data, fetchData, resourceKey]
  );

  return {
    data,
    isFetching,
    isMutating,
    error,

    fetchData,
    createResource,
    updateResource,
    deleteResource,

    setData: (v) => setData(Array.isArray(v) ? v : []),
  };
};
// --- IGNORE ---
