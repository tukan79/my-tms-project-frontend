// src/components/plan-it/PlanItOrders.jsx
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { RefreshCw } from 'lucide-react';

import { usePlanIt } from '@/contexts/PlanItContext.jsx';
import { isPostcodeInZone } from '@/utils/postcode.js';

/* =======================================================
   HOOK — HOME ZONE
======================================================= */
export const useHomeZone = (zones) =>
  useMemo(() => zones.find((z) => z.is_home_zone), [zones]);

/* =======================================================
   HOOK — TOOLTIP (clean + modern)
======================================================= */
const useTooltip = () => {
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: null,
    x: 0,
    y: 0,
  });

  const show = useCallback((e, content) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      content,
      x: r.left + window.scrollX + 18,
      y: r.bottom + window.scrollY + 12,
    });
  }, []);

  const hide = useCallback(() => {
    setTooltip((t) =>
      t.visible ? { visible: false, content: null, x: 0, y: 0 } : t
    );
  }, []);

  return { tooltip, show, hide };
};

/* =======================================================
   DRAGGABLE ORDER ROW
======================================================= */
const OrderRow = React.memo(
  ({ order, columns, index, isSelected, onClick, onContextMenu, onHover, onLeave }) => (
    <Draggable draggableId={`order-${order.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`planit-row ${isSelected ? 'selected' : ''} ${
            snapshot.isDragging ? 'dragging' : ''
          }`}
          onClick={(e) => onClick(e, order.id)}
          onContextMenu={(e) => onContextMenu(e, order.id)}
          onMouseEnter={(e) => onHover(e, order)}
          onMouseLeave={onLeave}
          style={{ ...provided.draggableProps.style }}
        >
          {columns.map((col, i) => (
            <div key={i} className="planit-cell">
              {col.accessor(order)}
            </div>
          ))}
        </div>
      )}
    </Draggable>
  )
);

/* =======================================================
   HOOK — FILTERED ORDERS (very efficient)
======================================================= */
const useFilteredOrders = ({ orders, activeTab, selectedDate, homeZone }) =>
  useMemo(() => {
    if (!orders) return [];

    const enriched = orders.map((o) => ({
      ...o,
      totalKilos: o.cargo_details?.total_kilos || 0,
      totalSpaces: o.cargo_details?.total_spaces || 0,
    }));

    const byDate = enriched.filter((o) => {
      const field =
        activeTab === 'collections'
          ? o.loading_date_time
          : o.unloading_date_time;

      if (!field) return false;
      try {
        return new Date(field).toISOString().split('T')[0] === selectedDate;
      } catch {
        return false;
      }
    });

    if (!homeZone) return byDate;

    return byDate.filter((o) =>
      isPostcodeInZone(
        activeTab === 'collections'
          ? o.sender_details?.postCode
          : o.recipient_details?.postCode,
        homeZone
      )
    );
  }, [orders, activeTab, selectedDate, homeZone]);

/* =======================================================
   MAIN COMPONENT — SAAS UI
======================================================= */
const PlanItOrders = ({ orders, homeZone, selectedDate, onRefresh }) => {
  const { selectedOrderIds, setSelectedOrderIds, setContextMenu } = usePlanIt();
  const [activeTab, setActiveTab] = useState('delivery');
  const { tooltip, show: showTooltip, hide: hideTooltip } = useTooltip();

  /* -----------------------------
     AUTO REFRESH
  ----------------------------- */
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timer = useRef(null);
  const REFRESH_MS = 30000;

  const manualRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  useEffect(() => {
    if (autoRefresh && onRefresh) {
      timer.current = setInterval(onRefresh, REFRESH_MS);
    }
    return () => {
      clearInterval(timer.current);
    };
  }, [autoRefresh, onRefresh]);

  /* -----------------------------
     COLUMNS CONFIG
  ----------------------------- */
  const ALL_COLUMNS = useMemo(
    () => [
      { header: 'Consignment #', accessor: (o) => o.order_number || '-' },
      { header: 'Loading Company', accessor: (o) => o.sender_details?.name || '-' },
      { header: 'Loading Address', accessor: (o) => o.sender_details?.address1 || '-' },
      { header: 'Loading PC', accessor: (o) => o.sender_details?.postCode || '-' },
      { header: 'Unloading Company', accessor: (o) => o.recipient_details?.name || '-' },
      { header: 'Unloading Address', accessor: (o) => o.recipient_details?.address1 || '-' },
      { header: 'Unloading PC', accessor: (o) => o.recipient_details?.postCode || '-' },
      { header: 'Weight', accessor: (o) => o.totalKilos || '-' },
      { header: 'Spaces', accessor: (o) => o.totalSpaces || '-' },
    ],
    []
  );

  const columns = useMemo(() => {
    return activeTab === 'delivery'
      ? [ALL_COLUMNS[0], ...ALL_COLUMNS.slice(4)]
      : [...ALL_COLUMNS.slice(0, 4), ALL_COLUMNS[7], ALL_COLUMNS[8]];
  }, [activeTab, ALL_COLUMNS]);

  /* -----------------------------
     FILTERED DATA
  ----------------------------- */
  const filteredOrders = useFilteredOrders({
    orders,
    activeTab,
    selectedDate,
    homeZone,
  });

  /* -----------------------------
     SELECTION + CONTEXT MENU
  ----------------------------- */
  const handleSelect = useCallback(
    (e, id) => {
      if (e.metaKey || e.ctrlKey) {
        setSelectedOrderIds((prev) =>
          prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
      } else {
        setSelectedOrderIds([id]);
      }
    },
    [setSelectedOrderIds]
  );

  const handleContextMenu = useCallback(
    (e, id) => {
      e.preventDefault();
      if (!selectedOrderIds.includes(id)) setSelectedOrderIds([id]);

      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [selectedOrderIds, setSelectedOrderIds, setContextMenu]
  );

  /* -----------------------------
     TOOLTIP CONTENT
  ----------------------------- */
  const handleHover = useCallback(
    (e, o) =>
      showTooltip(
        e,
        <>
          <strong>Loading:</strong> {o.sender_details?.name} —{' '}
          {o.sender_details?.postCode}
          <br />
          <strong>Unloading:</strong> {o.recipient_details?.name} —{' '}
          {o.recipient_details?.postCode}
        </>
      ),
    [showTooltip]
  );

  /* =======================================================
     RENDER
  ======================================================== */
  return (
    <div className="card planit-container">
      {/* HEADER */}
      <div className="section-header">
        <h3>Available Orders</h3>

        <div className="row gap-3 ml-auto">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivery')}
            >
              Delivery
            </button>
            <button
              className={`tab ${activeTab === 'collections' ? 'active' : ''}`}
              onClick={() => setActiveTab('collections')}
            >
              Collections
            </button>
          </div>

          {/* Auto refresh */}
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto</span>
          </label>

          <button className="btn-icon" onClick={manualRefresh}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="planit-grid-shell">
        <div className="planit-grid-header">
          {columns.map((col) => (
            <div key={col.header}>{col.header}</div>
          ))}
        </div>

        <Droppable droppableId="orders">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`planit-grid-body ${
                snapshot.isDraggingOver ? 'drag-over' : ''
              }`}
            >
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o, index) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    columns={columns}
                    index={index}
                    isSelected={selectedOrderIds.includes(o.id)}
                    onClick={handleSelect}
                    onContextMenu={handleContextMenu}
                    onHover={handleHover}
                    onLeave={hideTooltip}
                  />
                ))
              ) : (
                <div className="empty-state">No orders for this day.</div>
              )}

              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Tooltip */}
        {tooltip.visible && (
          <div className="tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
};

PlanItOrders.propTypes = {
  orders: PropTypes.array,
  homeZone: PropTypes.object,
  selectedDate: PropTypes.string,
  onRefresh: PropTypes.func,
};

export default React.memo(PlanItOrders);
