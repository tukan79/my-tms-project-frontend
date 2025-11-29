// src/components/plan-it/PlanItContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useToast } from '@/contexts/ToastContext.jsx';
import { useAssignments } from '@/hooks/useAssignments.js';

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
  bulkAssignOrders,
}) => {
  const { showToast } = useToast();

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

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
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

  const getStoredAutoRefresh = () => {
    try {
      if (!globalThis?.localStorage) {
        return null;
      }
      return JSON.parse(
        globalThis.localStorage.getItem('autoRefreshEnabled')
      );
    } catch {
      return null;
    }
  };

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    const value = getStoredAutoRefresh();
    return typeof value === 'boolean' ? value : true;
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

  useEffect(() => {
    if (!globalThis?.localStorage) return;
    globalThis.localStorage.setItem(
      'autoRefreshEnabled',
      JSON.stringify(autoRefreshEnabled)
    );
  }, [autoRefreshEnabled]);

  useEffect(() => {
    if (!autoRefreshEnabled || !globalThis?.setInterval) {
      return undefined;
    }

    const REFRESH_INTERVAL = 30000;
    const interval = globalThis.setInterval(
      triggerRefresh,
      REFRESH_INTERVAL
    );

    return () => {
      if (globalThis?.clearInterval) {
        globalThis.clearInterval(interval);
      }
    };
  }, [autoRefreshEnabled, triggerRefresh]);

  const driverMap = useMemo(
    () => new Map(drivers.map(d => [d.id, d])),
    [drivers]
  );
  const truckMap = useMemo(
    () => new Map(trucks.map(t => [t.id, t])),
    [trucks]
  );
  const trailerMap = useMemo(
    () => new Map(trailers.map(t => [t.id, t])),
    [trailers]
  );
  const orderMap = useMemo(
    () => new Map(orders.map(o => [o.id, o])),
    [orders]
  );

  const assignmentsByRun = useMemo(() => {
    const map = new Map();

    initialAssignments.forEach(a => {
      const list = map.get(a.run_id) ?? [];
      list.push(a);
      map.set(a.run_id, list);
    });

    return map;
  }, [initialAssignments]);

  const enrichedRuns = useMemo(() => {
    return runs
      .filter(run => run.run_date?.startsWith(selectedDate))
      .map(run => {
        const driver = driverMap.get(run.driver_id);
        const truck = truckMap.get(run.truck_id);
        const trailer = trailerMap.get(run.trailer_id);

        const runAssignments = assignmentsByRun.get(run.id) ?? [];
        const assignedOrders = runAssignments
          .map(a => orderMap.get(a.order_id))
          .filter(Boolean);

        let totalKilos = 0;
        let totalSpaces = 0;

        assignedOrders.forEach(order => {
          totalKilos += order?.cargo_details?.total_kilos ?? 0;
          totalSpaces += order?.cargo_details?.total_spaces ?? 0;
        });

        const isRigid = truck?.type_of_truck === 'rigid';
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
          : 'No Driver';

        const truckPlate = truck?.registration_plate ?? 'No Truck';
        const trailerPlate = trailer?.registration_plate ?? '';

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
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const activeRun = useMemo(() => {
    if (!activeRunId) return null;
    return enrichedRuns.find(r => r.id === activeRunId) ?? null;
  }, [activeRunId, enrichedRuns]);

  const ordersForActiveRun = useMemo(() => {
    if (!activeRun) return [];

    return assignments
      .filter(a => a.run_id === activeRun.id)
      .map(a => {
        const order = orderMap.get(a.order_id);
        return order ? { ...order, assignmentId: a.id } : null;
      })
      .filter(Boolean);
  }, [activeRun, assignments, orderMap]);

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

  const contextValue = useMemo(
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
      assignments,
      isRefreshing,
      autoRefreshEnabled,

      setSelectedDate,
      setActiveRunId,
      setEditingRun,
      setIsFormVisible,
      setSelectedOrderIds,
      setContextMenu,
      setAutoRefreshEnabled,

      handleEditRun,
      handleAddNewRun,
      handleDeleteAssignment: handleDeleteAssignmentWithRefresh,
      handleDragEnd,

      initialData: { drivers, trucks, trailers, zones, pallets },
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
      trucks,
      trailers,
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
