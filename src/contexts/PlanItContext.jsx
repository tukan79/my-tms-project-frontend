import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';
import { useAssignments } from '@/hooks/useAssignments.js';

/** ---------------------------------------------------
 * ✅ Kontekst PlanIt
 * Obsługuje runs, orders, assignments i auto-refresh
 * --------------------------------------------------- */
const PlanItContext = createContext(null);

export const usePlanIt = () => {
  const context = useContext(PlanItContext);
  if (!context) {
    throw new Error('usePlanIt must be used within a PlanItProvider');
  }
  return context;
};

export const PlanItProvider = ({
  children,
  initialData = {},
  runActions,
  onAssignmentCreated,
  onDeleteRequest,
  bulkAssignOrders: bulkAssignOrdersFromHook,
}) => {
  const { showToast } = useToast();

  /** --- Dekonstrukcja danych początkowych --- */
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
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [activeRunId, setActiveRunId] = useState(null);
  const [editingRun, setEditingRun] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  /** --- Auto-refresh --- */
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefreshEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  /** --- Manualny trigger refreshu --- */
  const triggerRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return; // blokada spam refreshy
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      if (onAssignmentCreated) await onAssignmentCreated();
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
      showToast('Failed to refresh data.', 'error');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }, 500);
    }
  }, [onAssignmentCreated, showToast]);

  /** --- Auto-refresh co 30 sek --- */
  useEffect(() => {
    localStorage.setItem('autoRefreshEnabled', JSON.stringify(autoRefreshEnabled));
    if (!autoRefreshEnabled) return;
    const REFRESH_INTERVAL = 30_000;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered...');
      triggerRefresh();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, triggerRefresh]);

  /** --- Optymalizacja: szybki lookup --- */
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const truckMap = useMemo(() => new Map(trucks.map((t) => [t.id, t])), [trucks]);
  const trailerMap = useMemo(() => new Map(trailers.map((t) => [t.id, t])), [trailers]);
  const orderMap = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  /** --- Grupowanie assignments po run_id --- */
  const assignmentsByRun = useMemo(() => {
    const map = new Map();
    for (const a of initialAssignments) {
      if (!map.has(a.run_id)) map.set(a.run_id, []);
      map.get(a.run_id).push(a);
    }
    return map;
  }, [initialAssignments]);

  /** --- Enrichment runs (driver, truck, trailer, payload, etc.) --- */
  const enrichedRuns = useMemo(() => {
    return runs
      .filter((run) => run.run_date?.startsWith(selectedDate))
      .map((run) => {
        const driver = driverMap.get(run.driver_id);
        const truck = truckMap.get(run.truck_id);
        const trailer = run.trailer_id ? trailerMap.get(run.trailer_id) : null;
        const runAssignments = assignmentsByRun.get(run.id) || [];

        const assignedOrders = runAssignments
          .map((a) => orderMap.get(a.order_id))
          .filter(Boolean);

        const { totalKilos, totalSpaces } = assignedOrders.reduce(
          (acc, o) => {
            acc.totalKilos += o.cargo_details?.total_kilos || 0;
            acc.totalSpaces += o.cargo_details?.total_spaces || 0;
            return acc;
          },
          { totalKilos: 0, totalSpaces: 0 }
        );

        const hasCapacity =
          truck?.type_of_truck === 'rigid' ||
          (truck?.type_of_truck === 'tractor' && trailer);

        const maxPayload =
          hasCapacity &&
          (truck?.type_of_truck === 'rigid'
            ? truck.max_payload_kg
            : trailer?.max_payload_kg);

        const maxPallets =
          hasCapacity &&
          (truck?.type_of_truck === 'rigid'
            ? truck.pallet_capacity
            : trailer?.max_spaces);

        return {
          ...run,
          displayText: `${driver ? `${driver.first_name} ${driver.last_name}` : 'No Driver'} - ${
            truck ? truck.registration_plate : 'No Truck'
          } ${trailer ? `+ ${trailer.registration_plate}` : ''}`,
          totalKilos,
          totalSpaces,
          maxPayload,
          maxPallets,
          hasCapacity,
        };
      });
  }, [runs, selectedDate, driverMap, truckMap, trailerMap, assignmentsByRun, orderMap]);

  /** --- Hook useAssignments --- */
  const {
    assignments,
    availableOrders,
    handleDragEnd,
    handleDeleteAssignment,
    bulkAssignOrders,
    error,
  } = useAssignments({
    initialAssignments,
    orders,
    enrichedRuns,
    onDataRefresh: triggerRefresh,
  });

  useEffect(() => {
    if (error) {
      console.error('❌ useAssignments error:', error);
      showToast(error, 'error');
    }
  }, [error, showToast]);

  /** --- Active run i przypisane zlecenia --- */
  const activeRun = useMemo(
    () => enrichedRuns.find((r) => r.id === activeRunId) || null,
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

  /** --- Handlery UI --- */
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
      try {
        const payload = {
          ...runData,
          trailer_id: runData.trailer_id || null,
        };

        if (editingRun) {
          await runActions.update(editingRun.id, payload);
          showToast('Run updated successfully!', 'success');
        } else {
          await runActions.create(payload);
          showToast('Run created successfully!', 'success');
        }

        setIsFormVisible(false);
        setEditingRun(null);
        triggerRefresh();

        if (payload?.run_date && payload.run_date !== selectedDate) {
          setSelectedDate(payload.run_date);
          setActiveRunId(null);
        }
      } catch (error) {
        console.error('❌ Error saving run:', error);
        showToast(
          `Failed to save run: ${error?.response?.data?.message || error.message}`,
          'error'
        );
      }
    },
    [editingRun, runActions, showToast, triggerRefresh, selectedDate]
  );

  const handleDeleteRun = useCallback(
    (run) => {
      onDeleteRequest(
        `Are you sure you want to delete run: ${run.displayText}?`,
        async () => {
          try {
            await runActions.delete(run.id);
            showToast(`Run "${run.displayText}" deleted.`, 'success');
            triggerRefresh();
          } catch (error) {
            console.error('❌ Error deleting run:', error);
            showToast(error.response?.data?.error || 'Failed to delete run.', 'error');
          }
        }
      );
    },
    [runActions, onDeleteRequest, showToast, triggerRefresh]
  );

  const handleDeleteAssignmentWithRefresh = useCallback(
    async (assignmentId) => {
      try {
        await handleDeleteAssignment(assignmentId);
        triggerRefresh();
      } catch (error) {
        console.error('❌ Error during assignment deletion:', error);
      }
    },
    [handleDeleteAssignment, triggerRefresh]
  );

  const handleBulkAssign = useCallback(async () => {
    if (!activeRunId) return showToast('Please select an active run first.', 'error');
    if (selectedOrderIds.length === 0)
      return showToast('No orders selected for assignment.', 'error');

    try {
      const payload = { run_id: activeRunId, order_ids: selectedOrderIds };
      const result = await bulkAssignOrdersFromHook(payload);
      if (result.success) {
        showToast(result.message, 'success');
        setSelectedOrderIds([]);
        triggerRefresh();
      } else showToast(result.message, 'error');
    } catch (error) {
      console.error('❌ Bulk assign failed:', error);
      showToast('Unexpected error during bulk assignment.', 'error');
    }
  }, [activeRunId, selectedOrderIds, bulkAssignOrdersFromHook, showToast, triggerRefresh]);

  const handleBulkDelete = useCallback(() => {
    if (selectedOrderIds.length === 0)
      return showToast('No orders selected for deletion.', 'error');

    const onConfirm = async () => {
      try {
        await api.delete('/api/orders/bulk', { data: { ids: selectedOrderIds } });
        showToast(`${selectedOrderIds.length} orders deleted.`, 'success');
        setSelectedOrderIds([]);
        triggerRefresh();
      } catch (error) {
        console.error('❌ Bulk delete failed:', error);
        showToast(error.response?.data?.error || 'Failed to delete orders.', 'error');
      }
    };

    onDeleteRequest(
      `Are you sure you want to delete ${selectedOrderIds.length} orders? This action cannot be undone.`,
      onConfirm
    );
  }, [selectedOrderIds, onDeleteRequest, showToast, triggerRefresh]);

  /** --- Wartość kontekstu --- */
  const value = useMemo(
    () => ({
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
      autoRefreshEnabled,
      isRefreshing,
      setSelectedDate,
      setActiveRunId,
      setIsFormVisible,
      setSelectedOrderIds,
      setContextMenu,
      setAutoRefreshEnabled,
      handleEditRun,
      handleAddNewRun,
      handleSaveRun,
      handleDeleteRun,
      handleDragEnd,
      handleDeleteAssignment: handleDeleteAssignmentWithRefresh,
      handleBulkAssign,
      handleBulkDelete,
      triggerRefresh,
      initialData: { drivers, trucks, trailers, zones, pallets },
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
      autoRefreshEnabled,
      isRefreshing,
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

  return <PlanItContext.Provider value={value}>{children}</PlanItContext.Provider>;
};
