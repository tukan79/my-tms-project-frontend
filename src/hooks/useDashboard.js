// src/hooks/useDashboard.js
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

/**
 * Wyciąga nazwę zasobu z path:
 *  "/api/surcharge-types" -> "surcharge-types"
 *  "/api/zones" -> "zones"
 */
const deriveResourceKeyFromPath = (path = "") => {
  const cleaned = path.split("?")[0];
  const segments = cleaned.split("/").filter(Boolean);
  return segments[segments.length - 1] || null;
};

// Normalizuje pola kierowcy tak, by obsłużyć camelCase z API i snake_case w UI.
const normalizeDriver = (driver = {}) => ({
  ...driver,
  first_name: driver.first_name ?? driver.firstName ?? "",
  last_name: driver.last_name ?? driver.lastName ?? "",
  phone_number: driver.phone_number ?? driver.phoneNumber ?? "",
  license_number: driver.license_number ?? driver.licenseNumber ?? "",
  cpc_number: driver.cpc_number ?? driver.cpcNumber ?? "",
  login_code: driver.login_code ?? driver.loginCode ?? "",
  is_active:
    driver.is_active ?? driver.isActive ?? (driver.isDeleted === undefined ? null : !driver.isDeleted),
});

/**
 * 100% reliable parser:
 * znajduje NAJLEPIEJ pasującą tablicę w dowolnym kształcie odpowiedzi.
 */
const parseResponseData = (rawData, resourceKey) => {
  if (!rawData) return [];

  // 1) Jeśli API zwraca gołą tablicę
  if (Array.isArray(rawData)) return rawData;

  // Rekurencyjnie zbieramy wszystkie tablice z obiektu
  const findArraysDeep = (obj, path = []) => {
    if (!obj || typeof obj !== "object") return [];

    let found = [];

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (Array.isArray(value)) {
        found.push({ key, path: [...path, key], array: value });
      } else if (typeof value === "object") {
        found.push(...findArraysDeep(value, [...path, key]));
      }
    }

    return found;
  };

  const arrays = findArraysDeep(rawData);

  if (arrays.length === 0) return [];

  // 2) Jeśli mamy resourceKey, spróbujmy dopasować po nazwie
  if (resourceKey) {
    const norm = resourceKey.toLowerCase();

    // perfect match: "zones" -> zones
    const exact = arrays.find((a) => a.key.toLowerCase() === norm);
    if (exact) return exact.array;

    // plural: "zone" -> zones
    const plural = arrays.find((a) => a.key.toLowerCase() === `${norm}s`);
    if (plural) return plural.array;

    // fuzzy: "zone" -> zoneList / zonesData itd.
    const fuzzy = arrays.find((a) => a.key.toLowerCase().includes(norm));
    if (fuzzy) return fuzzy.array;
  }

  // 3) Jeśli jest tylko jedna tablica – nie kombinujemy, bierzemy ją
  if (arrays.length === 1) return arrays[0].array;

  // 4) Jeśli jest wiele – wybieramy najbardziej "top-level" (najkrótsza ścieżka)
  const shallowest = arrays.reduce((a, b) =>
    a.path.length <= b.path.length ? a : b
  );
  return shallowest.array;
};

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

  const fetchResource = useCallback(
    async (path, key, allowMissing = false) => {
      try {
        const res = await api.get(path);
        const effectiveKey = key || deriveResourceKeyFromPath(path);
        return parseResponseData(res.data, effectiveKey);
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.error || err?.message;
        const label = allowMissing ? "⚠️ Optional fetch" : "❌ Error loading";
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
      setDrivers(
        Array.isArray(driversData)
          ? driversData.map((driver) => normalizeDriver(driver))
          : []
      );
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
  }, [fetchResource]);

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
    const matchSearch = (run.title || run.displayText || "")
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchStatus =
      filters.status === "all" || run.status === filters.status;
    return matchSearch && matchStatus;
  });

  // 4. Actions
  const refreshRuns = async () => {
    try {
      const res = await api.get("/api/runs");
      setRuns(parseResponseData(res.data, "runs"));
    } catch (err) {
      console.error("❌ Failed to refresh runs:", err);
    }
  };

  const deleteRun = async (id) => {
    try {
      await api.delete(`/api/runs/${id}`);
      // Używasz _id w backendzie – zostawiłem tak jak było
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
