// src/components/plan-it/PlanItContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import PropTypes from "prop-types";

import { useToast } from "@/contexts/ToastContext.jsx";
import { useAssignments } from "@/hooks/useAssignments.js";
import { useApiResource } from "@/hooks/useApiResource.js";

/* ----------------------------------------------------------
   Normalizers (truck / trailer)
---------------------------------------------------------- */
const normalizeTruck = (truck = {}) => ({
  ...truck,
  registration_plate:
    truck.registration_plate ||
    truck.registrationPlate ||
    truck.plate ||
    truck.name ||
    "",
});

const normalizeTrailer = (trailer = {}) => ({
  ...trailer,
  registration_plate:
    trailer.registration_plate ||
    trailer.registrationPlate ||
    trailer.plate ||
    trailer.name ||
    "",
});

/* ----------------------------------------------------------
   CONTEXT SETUP
---------------------------------------------------------- */
const PlanItContext = createContext(null);

export const usePlanIt = () => {
  const ctx = useContext(PlanItContext);
  if (!ctx) throw new Error("usePlanIt must be used within PlanItProvider");
  return ctx;
};

/* ----------------------------------------------------------
   PROVIDER
---------------------------------------------------------- */
export const PlanItProvider = ({
  children,
  initialData = {},
  runActions,
  onAssignmentCreated,
  onDeleteRequest,
  bulkAssignOrders,
}) => {
  const { showToast } = useToast();

  /* ------------------------------------------------------
     INITIAL DATA
  ------------------------------------------------------ */
  const {
    orders = [],
    runs = [],
    drivers = [],
    trucks = [],
    trailers = [],
    pallets = [],
    assignments: initialAssignments = [],
    zones = [],
  } = initialData;

  /* ------------------------------------------------------
     FETCH TRUCKS / TRAILERS (fallback if missing)
  ------------------------------------------------------ */
  const needTrucks = !trucks || trucks.length === 0;
  const needTrailers = !trailers || trailers.length === 0;

  const { data: fetchedTrucks } = useApiResource(
    "/api/trucks",
    { initialFetch: needTrucks, enabled: needTrucks },
    "trucks"
  );

  const { data: fetchedTrailers } = useApiResource(
    "/api/trailers",
    { initialFetch: needTrailers, enabled: needTrailers },
    "trailers"
  );

  const effectiveTrucks = useMemo(
    () => ((needTrucks ? fetchedTrucks : trucks) || []).map(normalizeTruck),
    [needTrucks, fetchedTrucks, trucks]
  );

  const effectiveTrailers = useMemo(
    () => ((needTrailers ? fetchedTrailers : trailers) || []).map(normalizeTrailer),
    [needTrailers, fetchedTrailers, trailers]
  );

  /* ------------------------------------------------------
     UI STATE
  ------------------------------------------------------ */
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeRunId, setActiveRunId] = useState(null);
  const [editingRun, setEditingRun] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  /* ------------------------------------------------------
     AUTO REFRESH
  ------------------------------------------------------ */
  const getStoredAutoRefresh = () => {
    try {
      if (!globalThis?.localStorage) return null;
      return JSON.parse(globalThis.localStorage.getItem("autoRefreshEnabled"));
    } catch {
      return null;
    }
  };

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const stored = getStoredAutoRefresh();
    return typeof stored === "boolean" ? stored : true;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);

    if (onAssignmentCreated) {
      await onAssignmentCreated();
    }

    if (globalThis?.setTimeout) {
      globalThis.setTimeout(() => setIsRefreshing(false), 500);
    } else {
      setIsRefreshing(false);
    }
  }, [onAssignmentCreated]);

  // Persist user preference
  useEffect(() => {
    if (!globalThis?.localStorage) return;
    globalThis.localStorage.setItem(
      "autoRefreshEnabled",
      JSON.stringify(autoRefreshEnabled)
    );
  }, [autoRefreshEnabled]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshEnabled || !globalThis?.setInterval) return;

    const interval = globalThis.setInterval(triggerRefresh, 30000);

    return () => {
      globalThis?.clearInterval?.(interval);
    };
  }, [autoRefreshEnabled, triggerRefresh]);

  /* ------------------------------------------------------
     LOOKUP MAPS
  ------------------------------------------------------ */
  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers]
  );

  const truckMap = useMemo(
    () => new Map(effectiveTrucks.map((t) => [t.id, t])),
    [effectiveTrucks]
  );

  const trailerMap = useMemo(
    () => new Map(effectiveTrailers.map((t) => [t.id, t])),
    [effectiveTrailers]
  );

  const orderMap = useMemo(
    () => new Map(orders.map((o) => [o.id, o])),
    [orders]
  );

  /* ------------------------------------------------------
     GROUP ASSIGNMENTS BY RUN
  ------------------------------------------------------ */
  const assignmentsByRun = useMemo(() => {
    const map = new Map();
    initialAssignments.forEach((a) => {
      const list = map.get(a.run_id) ?? [];
      list.push(a);
      map.set(a.run_id, list);
    });
    return map;
  }, [initialAssignments]);

  /* ------------------------------------------------------
     ENRICHED RUN DATA (with capacity, totals, labels)
  ------------------------------------------------------ */
  const enrichedRuns = useMemo(() => {
    return runs
      .filter((run) => run.run_date?.startsWith(selectedDate))
      .map((run) => {
        const driver = driverMap.get(run.driver_id);
        const truck = truckMap.get(run.truck_id);
        const trailer = trailerMap.get(run.trailer_id);

        const runAssignments = assignmentsByRun.get(run.id) ?? [];

        const assignedOrders = runAssignments
          .map((a) => orderMap.get(a.order_id))
          .filter(Boolean);

        let totalKilos = 0;
        let totalSpaces = 0;

        assignedOrders.forEach((o) => {
          totalKilos += o?.cargo_details?.total_kilos ?? 0;
          totalSpaces += o?.cargo_details?.total_spaces ?? 0;
        });

        const isRigid = truck?.type_of_truck === "rigid";
        const hasCapacity = Boolean(isRigid || trailer);

        let maxPayload = null;
        let maxPallets = null;

        if (hasCapacity) {
          if (isRigid) {
            maxPayload = truck?.max_payload_kg ?? null;
            maxPallets = truck?.pallet_capacity ?? null;
          } else {
            maxPayload = trailer?.max_payload_kg ?? null;
            maxPallets = trailer?.max_spaces ?? null;
          }
        }

        const driverName = driver
          ? `${driver.first_name} ${driver.last_name}`
          : "No Driver";

        const truckPlate = truck?.registration_plate ?? "No Truck";
        const trailerPlate = trailer?.registration_plate ?? "";

        return {
          ...run,
          displayText: `${driverName} - ${truckPlate} ${trailerPlate}`,
          totalKilos,
          totalSpaces,
          maxPayload,
          maxPallets,
          hasCapacity,
        };
      });
  }, [
    runs,
    selectedDate,
    driverMap,
    truckMap,
    trailerMap,
    assignmentsByRun,
    orderMap,
  ]);

  /* ------------------------------------------------------
     ASSIGNMENTS HANDLING (drag/drop)
  ------------------------------------------------------ */
  const assignmentsData = useMemo(
    () => ({
      initialAssignments,
      orders,
      enrichedRuns,
      onDataRefresh: triggerRefresh,
    }),
    [initialAssignments, orders, enrichedRuns, triggerRefresh]
  );

  const {
    assignments,
    availableOrders,
    handleDragEnd,
    handleDeleteAssignment,
    error,
  } = useAssignments(assignmentsData);

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error, showToast]);

  /* ------------------------------------------------------
     ACTIVE RUN
  ------------------------------------------------------ */
  const activeRun = useMemo(() => {
    if (!activeRunId) return null;
    return enrichedRuns.find((r) => r.id === activeRunId) ?? null;
  }, [activeRunId, enrichedRuns]);

  const ordersForActiveRun = useMemo(() => {
    if (!activeRun) return [];
    return assignments
      .filter((a) => a.run_id === activeRun.id)
      .map((a) => {
        const order = orderMap.get(a.order_id);
        return order ? { ...order, assignmentId: a.id } : null;
      })
      .filter(Boolean);
  }, [activeRun, assignments, orderMap]);

  /* ------------------------------------------------------
     RUN FORM HANDLERS
  ------------------------------------------------------ */
  const handleEditRun = useCallback((run) => {
    setEditingRun(run);
    setIsFormVisible(true);
  }, []);

  const handleAddNewRun = useCallback(() => {
    setEditingRun(null);
    setIsFormVisible(true);
  }, []);

  const handleDeleteAssignmentWithRefresh = useCallback(
    async (id) => {
      await handleDeleteAssignment(id);
      await triggerRefresh();
    },
    [handleDeleteAssignment, triggerRefresh]
  );

  /* ------------------------------------------------------
     CONTEXT VALUE
  ------------------------------------------------------ */
  const contextValue = useMemo(
    () => ({
      // STATE
      selectedDate,
      activeRunId,
      editingRun,
      isFormVisible,
      selectedOrderIds,
      contextMenu,
      enrichedRuns,
      availableOrders,
      activeRun,
      ordersForActiveRun,
      assignments,
      isRefreshing,
      autoRefreshEnabled,

      // SETTERS
      setSelectedDate,
      setActiveRunId,
      setEditingRun,
      setIsFormVisible,
      setSelectedOrderIds,
      setContextMenu,
      setAutoRefreshEnabled,

      // HANDLERS
      handleEditRun,
      handleAddNewRun,
      handleDeleteAssignment: handleDeleteAssignmentWithRefresh,
      handleDragEnd,

      // META
      initialData: {
        drivers,
        trucks: effectiveTrucks,
        trailers: effectiveTrailers,
        zones,
        pallets,
      },

      triggerRefresh,
    }),
    [
      selectedDate,
      activeRunId,
      editingRun,
      isFormVisible,
      selectedOrderIds,
      contextMenu,
      enrichedRuns,
      availableOrders,
      activeRun,
      ordersForActiveRun,
      assignments,
      isRefreshing,
      autoRefreshEnabled,
      handleEditRun,
      handleAddNewRun,
      handleDeleteAssignmentWithRefresh,
      handleDragEnd,
      drivers,
      effectiveTrucks,
      effectiveTrailers,
      zones,
      pallets,
      triggerRefresh,
    ]
  );

  return (
    <PlanItContext.Provider value={contextValue}>
      {children}
    </PlanItContext.Provider>
  );
};

PlanItProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialData: PropTypes.object,
  runActions: PropTypes.object,
  onAssignmentCreated: PropTypes.func,
  onDeleteRequest: PropTypes.func,
  bulkAssignOrders: PropTypes.func,
};
