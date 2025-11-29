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
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [zones, setZones] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const isMounted = useRef(false);

  const safeArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchResource = useCallback(
    async (path, key, allowMissing = false) => {
      try {
        const res = await api.get(path);
        return safeArray(res.data, key);
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.error || err?.message;
        const label = allowMissing ? '⚠️ Optional fetch' : '❌ Error loading';
        console.warn(`${label} ${path}:`, status, message);
        return [];
      }
    },
    [api]
  );

  // 1. Load initial dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        runsData,
        surchargesData,
        driversData,
        trucksData,
        trailersData,
        customersData,
        ordersData,
        invoicesData,
        zonesData,
        usersData,
        assignmentsData,
      ] = await Promise.all([
        fetchResource("/api/runs", "runs"),
        fetchResource("/api/surcharge-types", "surcharges"),
        fetchResource("/api/drivers", "drivers"),
        fetchResource("/api/trucks", "trucks", true),
        fetchResource("/api/trailers", "trailers"),
        fetchResource("/api/customers", "customers"),
        fetchResource("/api/orders", "orders", true),
        fetchResource("/api/invoices", "invoices", true),
        fetchResource("/api/zones", "zones"),
        fetchResource("/api/users", "users", true),
        fetchResource("/api/assignments", "assignments", true),
      ]);

      setRuns(runsData);
      setSurchargeTypes(surchargesData);
      setDrivers(driversData);
      setTrucks(trucksData);
      setTrailers(trailersData);
      setCustomers(customersData);
      setOrders(ordersData);
      setInvoices(invoicesData);
      setZones(zonesData);
      setUsers(usersData);
      setAssignments(assignmentsData);
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
      // Safely extract array from response data
      const runsData = Array.isArray(res.data) ? res.data : (res.data?.runs || []);
      setRuns(runsData);
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
    // Expose all data sets
    users,
    drivers,
    trucks,
    trailers,
    customers,
    orders,
    invoices,
    surchargeTypes,
    zones,
    assignments,
    filters,
    updateFilter,
    refreshRuns,
    deleteRun,
    // Structured data object for consumers expecting dataFetching.data
    data: {
      runs: filteredRuns,
      users,
      drivers,
      trucks,
      trailers,
      customers,
      orders,
      invoices,
      surcharges: surchargeTypes,
      assignments,
      zones,
      pallets: [],
    },
  };
}
