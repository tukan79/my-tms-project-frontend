// frontend/src/contexts/PlanItContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';
import { useAssignments } from '@/hooks/useAssignments.js';

/** ---------------------------------------------------
 *  PlanItContext
 *  Zarządza:
 *   - runs + enrichment (driver, truck, trailer, capacity)
 *   - assignments + drag&drop
 *   - selected orders, bulk actions
 *   - auto-refresh (manual + interval)
 * --------------------------------------------------- */

const PlanItContext = createContext(null);

export const usePlanIt = () => {
  const ctx = useContext(PlanItContext);
  if (!ctx) {
    throw new Error('usePlanIt must be used within a PlanItProvider');
  }
  return ctx;
};

/* -------------------------------------------------------------
 *  Helpers — safe localStorage access
 * ------------------------------------------------------------- */
const readBoolFromStorage = (key, fallback = true) => {
  try {
    if (!globalThis?.localStorage) return fallback;
    const raw = globalThis.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'boolean' ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeToStorage = (key, value) => {
  try {
    if (!globalThis?.localStorage) return;
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // cicho ignorujemy błąd storage
  }
};

/* -------------------------------------------------------------
 *  Provider
 * ------------------------------------------------------------- */
export const PlanItProvider = ({
  children,
  initialData = {},
  runActions,
  onAssignmentCreated,
  onDeleteRequest,
  bulkAssignOrders: bulkAssignOrdersFromHook,
}) => {
  const { showToast } = useToast();

  /** --- Dekonstrukcja danych początkowych (zabezpieczenie) --- */
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

  /** --- Stan interfejsu --- */
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
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

  /** --- Auto-refresh (stan + ref blokujący spam) --- */
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() =>
    readBoolFromStorage('planit_autoRefreshEnabled', true)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const onAssignmentCreatedRef = useRef(onAssignmentCreated);
  useEffect(() => {
    onAssignmentCreatedRef.current = onAssignmentCreated;
  }, [onAssignmentCreated]);

  /** ---------------------------------------------------------
   *  Manualny trigger refreshu danych (PlanIt → parent dashboard)
   * --------------------------------------------------------- */
  const triggerRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      if (onAssignmentCreatedRef.current) {
        await onAssignmentCreatedRef.current();
      }
    } catch (error) {
      // Tu NIE rzucamy błędu dalej, tylko komunikat UX
      console.error('❌ Error during PlanIt refresh:', error);
      showToast('Failed to refresh PlanIt data.', 'error');
    } finally {
      // Delikatny debounce, żeby UI nie mrugał
      if (globalThis?.setTimeout) {
        globalThis.setTimeout(() => {
          setIsRefreshing(false);
          isRefreshingRef.current = false;
        }, 500);
      } else {
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }
    }
  }, [showToast]);

  /** ---------------------------------------------------------
   *  Auto-refresh co 30 sekund
   * --------------------------------------------------------- */
  useEffect(() => {
    writeToStorage('planit_autoRefreshEnabled', autoRefreshEnabled);
    if (!autoRefreshEnabled || !globalThis?.setInterval) return undefined;

    const REFRESH_INTERVAL = 30_000;

    const interval = globalThis.setInterval(() => {
      // Możesz wyłączyć ten log, jeśli za dużo spamuje
      console.debug?.('🔄 PlanIt auto-refresh tick');
      triggerRefresh();
    }, REFRESH_INTERVAL);

    return () => {
      if (globalThis?.clearInterval) {
        globalThis.clearInterval(interval);
      }
    };
  }, [autoRefreshEnabled, triggerRefresh]);

  /** ---------------------------------------------------------
   *  Szybkie mapy lookup (drivers, trucks, trailers, orders)
   * --------------------------------------------------------- */
  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers]
  );
  const truckMap = useMemo(
    () => new Map(trucks.map((t) => [t.id, t])),
    [trucks]
  );
  const trailerMap = useMemo(
    () => new Map(trailers.map((t) => [t.id, t])),
    [trailers]
  );
  const orderMap = useMemo(
    () => new Map(orders.map((o) => [o.id, o])),
    [orders]
  );

  /** ---------------------------------------------------------
   *  Hook useAssignments — pojedyncze źródło prawdy assignments
   * --------------------------------------------------------- */
  const {
    assignments,
    availableOrders,
    handleDragEnd,
    handleDeleteAssignment,
    error: assignmentsError,
  } = useAssignments({
    initialAssignments,
    orders,
    onDataRefresh: triggerRefresh,
  });

  useEffect(() => {
    if (assignmentsError) {
      console.error('❌ useAssignments error:', assignmentsError);
      showToast(assignmentsError, 'error');
    }
  }, [assignmentsError, showToast]);

  /** ---------------------------------------------------------
   *  Grupowanie assignments po run_id
   * --------------------------------------------------------- */
  const assignmentsByRun = useMemo(() => {
    const map = new Map();
    for (const a of assignments) {
      const list = map.get(a.run_id) ?? [];
      list.push(a);
      map.set(a.run_id, list);
    }
    return map;
  }, [assignments]);

  /** ---------------------------------------------------------
   *  Enrichment runs:
   *   - driver / truck / trailer
   *   - total kilos / spaces
   *   - maxPayload / maxPallets
   *   - displayText
   * --------------------------------------------------------- */
  const enrichedRuns = useMemo(() => {
    return runs
      .filter((run) => run.run_date?.startsWith(selectedDate))
      .map((run) => {
        const driver = driverMap.get(run.driver_id);
        const truck = truckMap.get(run.truck_id);
        const trailer = run.trailer_id ? trailerMap.get(run.trailer_id) : null;
        const runAssignments = assignmentsByRun.get(run.id) ?? [];

        const { totalKilos, totalSpaces } = runAssignments.reduce(
          (acc, a) => {
            const order = orderMap.get(a.order_id);
            if (!order) return acc;

            acc.totalKilos += order.cargo_details?.total_kilos ?? 0;
            acc.totalSpaces += order.cargo_details?.total_spaces ?? 0;
            return acc;
          },
          { totalKilos: 0, totalSpaces: 0 }
        );

        const isRigid = truck?.type_of_truck === 'rigid';
        const isTractor = truck?.type_of_truck === 'tractor';

        const hasCapacity = Boolean(
          isRigid ||
          (isTractor && trailer)
        );

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

        const displayDriver = driver
          ? `${driver.first_name} ${driver.last_name}`
          : 'No Driver';
        const displayTruck = truck?.registration_plate ?? 'No Truck';
        const displayTrailer = trailer
          ? `+ ${trailer.registration_plate}`
          : '';

        const displayText = displayTrailer
          ? `${displayDriver} - ${displayTruck} ${displayTrailer}`
          : `${displayDriver} - ${displayTruck}`;

        return {
          ...run,
          displayText,
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

  /** ---------------------------------------------------------
   *  Active run + przypisane zlecenia
   * --------------------------------------------------------- */
  const activeRun = useMemo(
    () => (activeRunId ? enrichedRuns.find((r) => r.id === activeRunId) ?? null : null),
    [activeRunId, enrichedRuns]
  );

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

  /** ---------------------------------------------------------
   *  Handlery UI / CRUD RUNS
   * --------------------------------------------------------- */
  const handleEditRun = useCallback((run) => {
    setEditingRun(run);
    setIsFormVisible(true);
  }, []);

  const handleAddNewRun = useCallback(() => {
    setEditingRun(null);
    setIsFormVisible(true);
  }, []);

  const handleSaveRun = useCallback(
    async (runData) => {
      if (!runActions) {
        showToast('Run actions are not configured.', 'error');
        return;
      }

      try {
        const payload = {
          ...runData,
          trailer_id: runData.trailer_id || null,
        };

        if (editingRun) {
          await runActions.update?.(editingRun.id, payload);
          showToast('Run updated successfully!', 'success');
        } else {
          await runActions.create?.(payload);
          showToast('Run created successfully!', 'success');
        }

        setIsFormVisible(false);
        setEditingRun(null);
        await triggerRefresh();

        // Jeśli zmieniono datę — przełącz widok na ten dzień
        if (payload?.run_date && payload.run_date !== selectedDate) {
          setSelectedDate(payload.run_date);
          setActiveRunId(null);
        }
      } catch (error) {
        console.error('❌ Error saving run:', error);
        showToast(
          `Failed to save run: ${
            error?.response?.data?.message || error.message
          }`,
          'error'
        );
      }
    },
    [editingRun, runActions, showToast, triggerRefresh, selectedDate]
  );

  const handleDeleteRun = useCallback(
    (run) => {
      if (!runActions?.delete) {
        showToast('Run delete action is not configured.', 'error');
        return;
      }

      onDeleteRequest?.(
        `Are you sure you want to delete run: ${run.displayText}?`,
        async () => {
          try {
            await runActions.delete(run.id);
            showToast(`Run "${run.displayText}" deleted.`, 'success');
            await triggerRefresh();
          } catch (error) {
            console.error('❌ Error deleting run:', error);
            showToast(
              error.response?.data?.error || 'Failed to delete run.',
              'error'
            );
          }
        }
      );
    },
    [runActions, onDeleteRequest, showToast, triggerRefresh]
  );

  /** ---------------------------------------------------------
   *  Delete assignment + refresh
   * --------------------------------------------------------- */
  const handleDeleteAssignmentWithRefresh = useCallback(
    async (assignmentId) => {
      try {
        await handleDeleteAssignment(assignmentId);
        await triggerRefresh();
      } catch (error) {
        console.error('❌ Error during assignment deletion:', error);
      }
    },
    [handleDeleteAssignment, triggerRefresh]
  );

  /** ---------------------------------------------------------
   *  Bulk assign orders → active run
   * --------------------------------------------------------- */
  const handleBulkAssign = useCallback(async () => {
    if (!activeRunId) {
      showToast('Please select an active run first.', 'error');
      return;
    }
    if (selectedOrderIds.length === 0) {
      showToast('No orders selected for assignment.', 'error');
      return;
    }
    if (!bulkAssignOrdersFromHook) {
      showToast('Bulk assign is not configured.', 'error');
      return;
    }

    try {
      const payload = { run_id: activeRunId, order_ids: selectedOrderIds };
      const result = await bulkAssignOrdersFromHook(payload);

      if (result?.success) {
        showToast(result.message || 'Orders assigned successfully.', 'success');
        setSelectedOrderIds([]);
        await triggerRefresh();
      } else {
        showToast(result?.message || 'Bulk assignment failed.', 'error');
      }
    } catch (error) {
      console.error('❌ Bulk assign failed:', error);
      showToast('Unexpected error during bulk assignment.', 'error');
    }
  }, [
    activeRunId,
    selectedOrderIds,
    bulkAssignOrdersFromHook,
    showToast,
    triggerRefresh,
  ]);

  /** ---------------------------------------------------------
   *  Bulk delete orders
   * --------------------------------------------------------- */
  const handleBulkDelete = useCallback(() => {
    if (selectedOrderIds.length === 0) {
      showToast('No orders selected for deletion.', 'error');
      return;
    }

    const onConfirm = async () => {
      try {
        await api.delete('/api/orders/bulk', {
          data: { ids: selectedOrderIds },
        });
        showToast(`${selectedOrderIds.length} orders deleted.`, 'success');
        setSelectedOrderIds([]);
        await triggerRefresh();
      } catch (error) {
        console.error('❌ Bulk delete failed:', error);
        showToast(
          error.response?.data?.error || 'Failed to delete orders.',
          'error'
        );
      }
    };

    onDeleteRequest?.(
      `Are you sure you want to delete ${selectedOrderIds.length} orders? This action cannot be undone.`,
      onConfirm
    );
  }, [selectedOrderIds, onDeleteRequest, showToast, triggerRefresh]);

  /** ---------------------------------------------------------
   *  Wartość kontekstu (PRO, posortowane, stabilne)
   * --------------------------------------------------------- */
  const contextValue = useMemo(
    () => ({
      // --- state ---
      selectedDate,
      activeRunId,
      editingRun,
      isFormVisible,
      selectedOrderIds,
      contextMenu,
      autoRefreshEnabled,
      isRefreshing,

      // --- data ---
      enrichedRuns,
      availableOrders,
      activeRun,
      ordersForActiveRun,

      // --- setters / state helpers ---
      setSelectedDate,
      setActiveRunId,
      setIsFormVisible,
      setSelectedOrderIds,
      setContextMenu,
      setAutoRefreshEnabled,

      // --- run handlers ---
      handleEditRun,
      handleAddNewRun,
      handleSaveRun,
      handleDeleteRun,

      // --- assignments / DnD ---
      handleDragEnd,
      handleDeleteAssignment: handleDeleteAssignmentWithRefresh,

      // --- bulk actions ---
      handleBulkAssign,
      handleBulkDelete,

      // --- external refresh bridge ---
      triggerRefresh,

      // --- meta for children (np. formularze, planit orders) ---
      initialData: { drivers, trucks, trailers, zones, pallets },
    }),
    [
      selectedDate,
      activeRunId,
      editingRun,
      isFormVisible,
      selectedOrderIds,
      contextMenu,
      autoRefreshEnabled,
      isRefreshing,
      enrichedRuns,
      availableOrders,
      activeRun,
      ordersForActiveRun,
      handleEditRun,
      handleAddNewRun,
      handleSaveRun,
      handleDeleteRun,
      handleDragEnd,
      handleDeleteAssignmentWithRefresh,
      handleBulkAssign,
      handleBulkDelete,
      triggerRefresh,
      drivers,
      trucks,
      trailers,
      zones,
      pallets,
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
  initialData: PropTypes.shape({
    orders: PropTypes.array,
    runs: PropTypes.array,
    drivers: PropTypes.array,
    trucks: PropTypes.array,
    trailers: PropTypes.array,
    pallets: PropTypes.array,
    assignments: PropTypes.array,
    zones: PropTypes.array,
  }),
  runActions: PropTypes.shape({
    update: PropTypes.func,
    create: PropTypes.func,
    delete: PropTypes.func,
  }),
  onAssignmentCreated: PropTypes.func,
  onDeleteRequest: PropTypes.func,
  bulkAssignOrders: PropTypes.func,
};
