import { useEffect, useState, useCallback, useRef } from "react";
import { useApi } from "./useApi";

/**
 * Debounce helper to limit the rate at which a function gets called.
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function useDashboard() {
  const api = useApi();

  const [runs, setRuns] = useState([]);
  const [surchargeTypes, setSurchargeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const isMounted = useRef(false);

  // 1. Load initial dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [runsRes, surchargeRes] = await Promise.all([
        api.get("/api/runs"),
        api.get("/api/surcharge-types"),
      ]);
      setRuns(runsRes.data || []);
      setSurchargeTypes(surchargeRes.data || []);
    } catch (err) {
      console.error("❌ Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Initial load - only once on component mount
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      loadDashboardData();
    }
  }, [loadDashboardData]);

  // 2. Filter handling with debounce
  const debouncedFilter = useRef(
    debounce((newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }, 400)
  ).current;

  const updateFilter = (field, value) => {
    debouncedFilter({ [field]: value });
  };

  // 3. Memoized filtered runs (client-side filtering)
  const filteredRuns = runs.filter((run) => {
    const matchSearch = (run.title || run.displayText || '')
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchStatus = filters.status === "all" || run.status === filters.status;
    return matchSearch && matchStatus;
  });

  // 4. Actions
  const refreshRuns = async () => {
    try {
      const res = await api.get("/api/runs");
      setRuns(res.data || []);
    } catch (err) {
      console.error("❌ Failed to refresh runs:", err);
    }
  };

  const deleteRun = async (id) => {
    try {
      await api.delete(`/api/runs/${id}`);
      setRuns((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("❌ Failed to delete run:", err);
      throw err;
    }
  };

  return {
    loading,
    runs: filteredRuns,
    surchargeTypes,
    filters,
    updateFilter,
    refreshRuns,
    deleteRun,
  };
}