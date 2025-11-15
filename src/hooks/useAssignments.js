// src/hooks/useAssignments.js
import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useApiResource } from './useApiResource';
import api from '@/services/api';
const CHANNEL_NAME = 'tms_state_sync';

/**
 * useAssignments - zarządza przypisaniami (assignments)
 */
export const useAssignments = ({
  initialAssignments = [],
  orders = [],
  enrichedRuns = [],
  onDataRefresh,
  autoRefreshInterval = 0 // ms
}) => {
  console.log('🔧 useAssignments called with:', { initialAssignmentsLength: initialAssignments?.length, ordersLength: orders?.length, enrichedRunsLength: enrichedRuns?.length });

  // resource hook (enabled zależy od tego, czy endpoint istnieje)
  const {
    data: assignments = [],
    error,
    fetchData,
    createResource: createAssignment,
    deleteResource: deleteAssignment,
    setData: setAssignments,
    enabled
  } = useApiResource('/api/assignments', 'assignment', [], { initialFetch: false });

  // ref do onDataRefresh (bez zmiany referencji)
  const refreshRef = useRef(onDataRefresh);
  useEffect(() => { refreshRef.current = onDataRefresh; }, [onDataRefresh]);

  // jednorazowy seed initialAssignments — nie nadpisujemy potem lokalnego stanu
  const seededRef = useRef(false);
  useEffect(() => {
    if (!enabled) { // jeśli resource wyłączony, zignoruj seed
      seededRef.current = false;
      setAssignments([]);
      return;
    }
    if (!seededRef.current && Array.isArray(initialAssignments) && initialAssignments.length > 0) {
      setAssignments(initialAssignments);
      seededRef.current = true;
    }
    // jeśli initialAssignments jest pusty i resource enabled, nie czyścimy tu — fetchData kontroluje zawartość
  }, [initialAssignments, enabled, setAssignments]);

  // auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    if (!enabled) return;
    const id = setInterval(async () => {
      console.log(`⏱️ Auto-refresh assignments (${autoRefreshInterval} ms)`);
      try {
        await fetchData();
        if (typeof refreshRef.current === 'function') refreshRef.current();
      } catch (e) {
        console.error('Auto-refresh assignments failed', e);
      }
    }, autoRefreshInterval);
    return () => clearInterval(id);
  }, [autoRefreshInterval, enabled, fetchData]);

  // BroadcastChannel listener — reaguje na REFRESH_VIEW / REFRESH_ALL
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    let lastHandled = 0;
    const MIN_MS = 500; // debounce

    const handler = (ev) => {
      try {
        const msg = ev?.data;
        if (!msg || !msg.type) return;
        const now = Date.now();
        if (now - lastHandled < MIN_MS) return;
        if (msg.type === 'REFRESH_ALL') {
          lastHandled = now;
          if (enabled) fetchData();
        } else if (msg.type === 'REFRESH_VIEW' && msg.view === 'assignments') {
          lastHandled = now;
          if (enabled) fetchData();
        }
      } catch (e) {
        console.error('Broadcast handler error (assignments):', e);
      }
    };

    channel.addEventListener ? channel.addEventListener('message', handler) : (channel.onmessage = handler);
    return () => {
      channel.removeEventListener ? channel.removeEventListener('message', handler) : (channel.onmessage = null);
      channel.close();
    };
  }, [enabled, fetchData]);

  /**
   * Enriched assignments: bezpieczne wyciąganie pól (obsługa braków)
   */
  const enrichedAssignments = useMemo(() => {
    if (!Array.isArray(assignments) || assignments.length === 0) return [];
    return assignments.map((assignment) => {
      const order = orders.find((o) => o?.id === assignment?.order_id);
      const run = enrichedRuns.find((r) => r?.id === assignment?.run_id);

      const orderNumber = order ? (order.order_number || order.customer_reference || `ID: ${order.id}`) : 'ORDER MISSING';
      const runText = run ? (run.displayText || run.name || `RUN ${run.id}`) : 'RUN N/A';
      const recipientName = order ? (order.recipient_details?.name || order.recipient_name || 'N/A') : 'N/A';

      return {
        ...assignment,
        order_number: orderNumber,
        run_text: runText,
        recipient_name: recipientName
      };
    });
  }, [assignments, orders, enrichedRuns]);

  /**
   * Dostępne (nieprzypisane) zamówienia
   * Note: waliduj statusy zgodnie z backendem. Tutaj używamy 'nowe' tak jak w Twoim kodzie.
   */
  const availableOrders = useMemo(() => {
    const assignedOrderIds = new Set((assignments || []).map((a) => a.order_id));
    return (orders || []).filter((o) => {
      if (!o) return false;
      // jeżeli status jest niepewny, traktuj jako nie-dostępne
      const status = (o.status || '').toString().toLowerCase();
      return status === 'nowe' && !assignedOrderIds.has(o.id);
    });
  }, [orders, assignments]);

  // Helper: parse number id from droppableId/draggableId safely
  const parseNumericId = (str) => {
    if (typeof str === 'number') return Number(str);
    if (!str || typeof str !== 'string') return NaN;
    // strip non-digits and parse
    const digits = str.match(/-?\d+/g);
    if (!digits) return NaN;
    // take last group of digits (handles "order-123" and "run-active-45")
    return Number(digits[digits.length - 1]);
  };

  /**
   * Drag & drop handler — tworzy przypisanie (z optymistycznym UI obsługiwanym przez useApiResource)
   */
  const handleDragEnd = useCallback(async (result) => {
    if (!enabled) {
      console.warn('Assignments resource not enabled — cannot create assignment.');
      return;
    }
    const { source, destination, draggableId } = result || {};
    if (!destination || source?.droppableId === destination?.droppableId) return;

    // Only handle dragging from orders to run droppable
    if (source.droppableId === 'orders' && destination.droppableId !== 'orders') {
      const orderId = parseNumericId(draggableId);
      if (Number.isNaN(orderId)) return;
      const runId = parseNumericId(destination.droppableId);
      if (Number.isNaN(runId)) return;

      const movedOrder = (orders || []).find((o) => o?.id === orderId);
      if (!movedOrder) {
        console.warn('Dragged order not found locally:', orderId);
        return;
      }

      try {
        // optimisticFn produces a temporary item for UI while waiting for server
        await createAssignment(
          { order_id: orderId, run_id: runId },
          (newAssignment, tempId) => {
            const run = (enrichedRuns || []).find((r) => r?.id === newAssignment?.run_id);
            return {
              ...newAssignment,
              id: tempId,
              order_id: orderId,
              run_id: runId,
              order_number: movedOrder.customer_reference || `ID: ${movedOrder.id}`,
              run_text: run?.displayText || 'N/A',
              recipient_name: movedOrder.recipient_details?.name || 'N/A',
            };
          }
        );

        // call external refresh hook if provided
        if (typeof refreshRef.current === 'function') refreshRef.current();

        // broadcast to other tabs
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type: 'REFRESH_VIEW', view: 'assignments' });
          bc.postMessage({ type: 'REFRESH_VIEW', view: 'orders' });
          bc.close();
        } catch (e) {
          console.warn('Broadcast failed:', e);
        }

      } catch (err) {
        console.error('❌ Failed to create assignment:', err);
      }
    }
  }, [createAssignment, orders, enrichedRuns, enabled]);

  /**
   * Delete assignment
   */
  const handleDeleteAssignment = useCallback(async (assignmentId) => {
    if (!enabled) {
      console.warn('Assignments resource not enabled — cannot delete assignment.');
      return;
    }
    console.log('🗑️ Deleting assignment:', assignmentId);
    try {
      const ok = await deleteAssignment(assignmentId);
      if (ok) {
        // useApiResource already removed it optimistically; ensure other tabs refresh
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type: 'REFRESH_VIEW', view: 'assignments' });
          bc.postMessage({ type: 'REFRESH_VIEW', view: 'orders' });
          bc.close();
        } catch (e) { /* ignore */ }
        if (typeof refreshRef.current === 'function') refreshRef.current();
        console.log('✅ Assignment deleted successfully');
      }
    } catch (err) {
      console.error('❌ Error deleting assignment:', err);
    }
  }, [deleteAssignment, enabled]);

  /**
   * Bulk assign — używa API i od razu fetchuje assignments
   */
  const bulkAssignOrders = useCallback(async (runId, orderIds) => {
    if (!enabled) {
      return { success: false, message: 'Assignments resource not enabled.' };
    }
    try {
      const resp = await api.post('/api/assignments/bulk', { run_id: runId, order_ids: orderIds });
      // ensure canonical state
      try { await fetchData(); } catch (e) { console.warn('fetchData after bulk assign failed', e); }
      // broadcast to other tabs
      try {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: 'REFRESH_VIEW', view: 'assignments' });
        bc.postMessage({ type: 'REFRESH_VIEW', view: 'orders' });
        bc.close();
      } catch (e) { /* ignore */ }
      if (typeof refreshRef.current === 'function') refreshRef.current();
      return { success: true, message: resp.data?.message || `${orderIds.length} orders assigned successfully.` };
    } catch (err) {
      console.error('Bulk assign failed:', err);
      return {
        success: false,
        message: err.response?.data?.error || 'Failed to bulk assign orders.',
      };
    }
  }, [fetchData, enabled]);

  return {
    assignments: enrichedAssignments,
    rawAssignments: assignments,
    availableOrders,
    handleDragEnd,
    handleDeleteAssignment,
    bulkAssignOrders,
    error,
    fetchAssignments: fetchData,
  };
};
