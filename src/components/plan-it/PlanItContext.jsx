import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import api from '@/services/api.js';
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

export const PlanItProvider = ({ children, initialData = {}, runActions, onAssignmentCreated, onDeleteRequest, bulkAssignOrders: bulkAssignOrdersFromHook }) => {
  const { showToast } = useToast();
  
  // Zapewniamy domyślne puste tablice dla wszystkich danych, aby uniknąć błędów
  const { 
    orders = [], 
    runs = [], 
    drivers = [], 
    trucks = [], 
    trailers = [], 
    pallets = [],
    assignments: initialAssignmentsFromData = [],
    zones = [] 
  } = initialData;

  // --- State Management ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeRunId, setActiveRunId] = useState(null);
  const [editingRun, setEditingRun] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  // Stabilna funkcja do wymuszania odświeżania danych z poziomu nadrzędnego komponentu
  const triggerRefresh = useCallback(() => {
    if (onAssignmentCreated) {
      onAssignmentCreated();
    }
  }, [onAssignmentCreated]);

  // --- Optymalizacja wydajności: Tworzenie map (lookup tables) do szybkiego wyszukiwania ---
  const driverMap = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers]);
  const truckMap = useMemo(() => new Map(trucks.map(t => [t.id, t])), [trucks]);
  const trailerMap = useMemo(() => new Map(trailers.map(t => [t.id, t])), [trailers]);
  const orderMap = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);

  // Grupowanie przypisań po run_id dla błyskawicznego dostępu O(1) w pętli
  const assignmentsByRun = useMemo(() => {
    const map = new Map();
    for (const assignment of initialAssignmentsFromData) {
      if (!map.has(assignment.run_id)) {
        map.set(assignment.run_id, []);
      }
      map.get(assignment.run_id).push(assignment);
    }
    return map;
  }, [initialAssignmentsFromData]);

  // --- Memoized Data Derivations ---
  const enrichedRuns = useMemo(() => {
    const filteredRuns = runs.filter(run => run.run_date?.startsWith(selectedDate));

    return filteredRuns.map(run => {
      const driver = driverMap.get(run.driver_id);
      const truck = truckMap.get(run.truck_id);
      const trailer = run.trailer_id ? trailerMap.get(run.trailer_id) : null;

      const runAssignments = assignmentsByRun.get(run.id) || [];
      const assignedOrders = runAssignments.map(a => orderMap.get(a.order_id)).filter(Boolean);

      const { totalKilos, totalSpaces } = assignedOrders.reduce((acc, order) => {
        acc.totalKilos += order.cargo_details?.total_kilos || 0;
        acc.totalSpaces += order.cargo_details?.total_spaces || 0;
        return acc;
      }, { totalKilos: 0, totalSpaces: 0 });

      const hasCapacity = truck?.type_of_truck === 'rigid' || (truck?.type_of_truck === 'tractor' && trailer);
      const maxPayload = hasCapacity ? (truck?.type_of_truck === 'rigid' ? truck.max_payload_kg : trailer?.max_payload_kg) : null;
      const maxPallets = hasCapacity ? (truck?.type_of_truck === 'rigid' ? truck.pallet_capacity : trailer?.max_spaces) : null;

      return {
        ...run,
        displayText: `${driver ? `${driver.first_name} ${driver.last_name}` : 'No Driver'} - ${truck ? truck.registration_plate : 'No Truck'} ${trailer ? `+ ${trailer.registration_plate}` : ''}`,
        totalKilos,
        totalSpaces,
        maxPayload,
        maxPallets,
        hasCapacity,
      };
    });
  }, [runs, selectedDate, driverMap, truckMap, trailerMap, assignmentsByRun, orderMap]);

  const assignmentsData = useMemo(() => ({
    initialAssignments: initialAssignmentsFromData,
    orders,
    enrichedRuns,
    onDataRefresh: triggerRefresh,
  }), [initialAssignmentsFromData, orders, enrichedRuns, triggerRefresh]);

  const {
    assignments,
    availableOrders,
    handleDragEnd,
    handleDeleteAssignment,
    error,
  } = useAssignments(assignmentsData);

  // Centralna obsługa błędów z hooka useAssignments
  React.useEffect(() => {
    if (error) {
      console.error('❌ useAssignments error:', error);
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const activeRun = useMemo(() => activeRunId ? enrichedRuns.find(run => run.id === activeRunId) : null, [activeRunId, enrichedRuns]);

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

  // --- Handlers ---
  const handleEditRun = useCallback((run) => {
    setEditingRun(run);
    setIsFormVisible(true);
  }, []);

  const handleAddNewRun = useCallback(() => {
    setEditingRun(null);
    setIsFormVisible(true);
  }, []);

  const handleSaveRun = useCallback(async (runData) => {
    try {
      const payload = { ...runData, trailer_id: runData.trailer_id || null };

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
    } catch (err) {
      console.error('❌ Error saving run:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save run', 'error');
    }
  }, [editingRun, runActions, showToast, triggerRefresh, selectedDate]);

  const handleDeleteRun = useCallback(async (run) => {
    onDeleteRequest(
      `Are you sure you want to delete run: ${run.displayText}?`,
      async () => {
        try {
          await runActions.delete(run.id);
          showToast(`Run "${run.displayText}" deleted.`, 'success');
          triggerRefresh();
        } catch (err) {
          console.error('❌ Error deleting run:', err);
          showToast(err.response?.data?.error || 'Failed to delete run.', 'error');
        }
      }
    );
  }, [runActions, showToast, triggerRefresh, onDeleteRequest]);

  const handleDeleteAssignmentWithRefresh = useCallback(async (assignmentId) => {
    try {
      await handleDeleteAssignment(assignmentId);
      triggerRefresh();
    } catch (err) {
      console.error('❌ Error during assignment deletion and refresh:', err);
      // Błąd jest już obsłużony w `useAssignments`, więc nie trzeba go tu ponownie pokazywać
    }
  }, [handleDeleteAssignment, triggerRefresh]);

  const handleBulkAssign = useCallback(async () => {
    if (!activeRunId) return showToast('Please select an active run first.', 'error');
    if (selectedOrderIds.length === 0) return showToast('No orders selected for assignment.', 'error');

    try {
      const result = await bulkAssignOrdersFromHook({ run_id: activeRunId, order_ids: selectedOrderIds });
      if (result.success) {
        showToast(result.message, 'success');
        setSelectedOrderIds([]);
        triggerRefresh();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      console.error('❌ Bulk assign failed:', err);
      showToast(err.response?.data?.message || 'An unexpected error occurred.', 'error');
    }
  }, [activeRunId, selectedOrderIds, bulkAssignOrdersFromHook, showToast, triggerRefresh]);

  const handleBulkDelete = useCallback(() => {
    if (selectedOrderIds.length === 0) return showToast('No orders selected for deletion.', 'error');
    
    const onConfirm = async () => {
      try {
        await api.delete('/api/orders/bulk', { data: { ids: selectedOrderIds } });
        showToast(`${selectedOrderIds.length} orders deleted successfully.`, 'success');
        setSelectedOrderIds([]);
        triggerRefresh();
      } catch (err) {
        console.error('❌ Bulk delete failed:', err);
        showToast(err.response?.data?.error || 'Failed to delete orders.', 'error');
      }
    };
    
    onDeleteRequest(`Are you sure you want to delete ${selectedOrderIds.length} selected orders? This action cannot be undone.`, onConfirm);
  }, [selectedOrderIds, onDeleteRequest, showToast, triggerRefresh]);

  // --- Context Value ---
  const value = useMemo(() => ({
    selectedDate,
    activeRunId,
    editingRun,
    isFormVisible,
    selectedOrderIds,
    contextMenu,
    setSelectedDate,
    setActiveRunId,
    setIsFormVisible,
    setSelectedOrderIds,
    setContextMenu,
    handleEditRun,
    handleAddNewRun,
    handleSaveRun,
    handleBulkAssign,
    handleBulkDelete,
    handleDeleteRun,
    enrichedRuns,
    availableOrders,
    activeRun,
    ordersForActiveRun,
    handleDragEnd,
    handleDeleteAssignment: handleDeleteAssignmentWithRefresh,
    initialData: { drivers, trucks, trailers, zones, pallets },
    triggerRefresh,
  }), [
    selectedDate, activeRunId, editingRun, isFormVisible, selectedOrderIds, contextMenu,
    handleEditRun, handleAddNewRun, handleSaveRun, handleBulkAssign, handleBulkDelete, handleDeleteRun,
    enrichedRuns, availableOrders, activeRun, ordersForActiveRun, handleDragEnd, handleDeleteAssignmentWithRefresh,
    drivers, trucks, trailers, zones, pallets, triggerRefresh
  ]);

  return <PlanItContext.Provider value={value}>{children}</PlanItContext.Provider>;
};
