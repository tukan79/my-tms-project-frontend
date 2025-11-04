import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useApiResource } from './useApiResource';
import api from '@/services/api';
import { broadcastRefreshView } from '@/utils/broadcastUtils';

/**
 * Zarządza przypisaniami (assignments) między zamówieniami a kursami (runs),
 * z obsługą drag&drop, broadcastu między zakładkami i optymalizacją danych.
 */
export const useAssignments = ({
  initialAssignments = [],
  orders = [],
  enrichedRuns = [],
  onDataRefresh,
  autoRefreshInterval = 0 // ms — np. 30000 = odświeżaj co 30 sekund
}) => {
  console.log('🔧 useAssignments called with:', { initialAssignments, orders, enrichedRuns });

  const {
    data: assignments,
    error,
    fetchData,
    createResource: createAssignment,
    deleteResource: deleteAssignment,
    setData: setAssignments
  } = useApiResource('/api/assignments', 'assignment');

  const refreshRef = useRef(onDataRefresh);
  useEffect(() => { refreshRef.current = onDataRefresh; }, [onDataRefresh]);

  /**
   * 🔁 Synchronizacja z `initialAssignments`
   */
  useEffect(() => {
    if (initialAssignments?.length) {
      setAssignments(initialAssignments);
    } else {
      setAssignments([]);
    }
  }, [initialAssignments, setAssignments]);

  /**
   * 🕐 Opcjonalne automatyczne odświeżanie danych z API
   */
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    const intervalId = setInterval(() => {
      console.log(`⏱️ Auto-refresh assignments (${autoRefreshInterval} ms)`);
      fetchData();
      if (refreshRef.current) refreshRef.current();
    }, autoRefreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchData]);


  /**
   * 🧩 Enrichment danych assignments z orders + runs
   */
  const enrichedAssignments = useMemo(() => {
    if (!assignments.length) return [];
    return assignments.map((assignment) => {
      const order = orders.find((o) => o.id === assignment.order_id);
      const run = enrichedRuns.find((r) => r.id === assignment.run_id);
      return {
        ...assignment,
        order_number: order?.order_number || order?.customer_reference || `ID: ${order?.id}`,
        run_text: run?.displayText || 'N/A',
        recipient_name: order?.recipient_details?.name || 'N/A',
      };
    });
  }, [assignments, orders, enrichedRuns]);

  /**
   * 🧮 Dostępne (nieprzypisane) zamówienia
   */
  const availableOrders = useMemo(() => {
    const assignedOrderIds = new Set(assignments.map((a) => a.order_id));
    return orders.filter((o) => o.status === 'nowe' && !assignedOrderIds.has(o.id));
  }, [orders, assignments]);

  /**
   * 🖱️ Obsługa drag&drop — tworzenie przypisania
   */
  const handleDragEnd = useCallback(
    async (result) => {
      const { source, destination, draggableId } = result;
      if (!destination || source.droppableId === destination.droppableId) return;

      if (source.droppableId === 'orders' && destination.droppableId !== 'orders') {
        const cleanId = draggableId.startsWith('order-') ? draggableId.slice(6) : draggableId;
        const orderId = Number(cleanId);
        if (Number.isNaN(orderId)) return;

        const runId = destination.droppableId.startsWith('run-active-')
          ? Number(destination.droppableId.replace('run-active-', ''))
          : Number(destination.droppableId);

        const movedOrder = orders.find((o) => o.id === orderId);
        if (!movedOrder) return;

        try {
          await createAssignment({ order_id: orderId, run_id: runId }, (newAssignment, tempId) => {
            const run = enrichedRuns.find((r) => r.id === newAssignment.run_id);
            return {
              ...newAssignment,
              id: tempId,
              order_number: movedOrder.customer_reference || `ID: ${movedOrder.id}`,
              run_text: run?.displayText || 'N/A',
              recipient_name: movedOrder.recipient_details?.name || 'N/A',
            };
          });

          if (refreshRef.current) refreshRef.current();
          broadcastRefreshView('assignments');
          broadcastRefreshView('orders'); // Odświeżamy też zlecenia, bo zmienia się ich status "dostępności"
        } catch (err) {
          console.error('❌ Failed to create assignment:', err);
        }
      }
    },
    [createAssignment, orders, enrichedRuns]
  );

  /**
   * 🗑️ Usuwanie przypisania
   */
  const handleDeleteAssignment = useCallback(
    async (assignmentId) => {
      console.log('🗑️ Deleting assignment:', assignmentId);
      try {
        await deleteAssignment(assignmentId);
        broadcastRefreshView('assignments');
        broadcastRefreshView('orders'); // Odświeżamy też zlecenia
        console.log('✅ Assignment deleted successfully');
      } catch (err) {
        console.error('❌ Error deleting assignment:', err);
      }
    },
    [deleteAssignment]
  );

  /**
   * ⚙️ Bulk assign — przypisanie wielu zamówień do jednego kursu
   */
  const bulkAssignOrders = useCallback(
    async (runId, orderIds) => {
      try {
        await api.post('/api/assignments/bulk', { run_id: runId, order_ids: orderIds });
        if (refreshRef.current) refreshRef.current();
        broadcastRefreshView('assignments');
        broadcastRefreshView('orders');
        return { success: true, message: `${orderIds.length} orders assigned successfully.` };
      } catch (err) {
        console.error('Bulk assign failed:', err);
        return {
          success: false,
          message: err.response?.data?.error || 'Failed to bulk assign orders.',
        };
      }
    },
    []
  );

  return {
    assignments: enrichedAssignments,
    availableOrders,
    handleDragEnd,
    handleDeleteAssignment,
    bulkAssignOrders,
    error,
  };
};

// ostatnia zmiana (04.11.2025, 20:30:00)
