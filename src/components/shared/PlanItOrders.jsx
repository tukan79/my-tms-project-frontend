// PlanItOrders.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { FixedSizeList } from 'react-window';
import { usePlanIt } from '../../contexts/PlanItContext.jsx';
import { isPostcodeInZone } from '../../utils/postcode.js';

// Eksportujemy hook, aby można go było użyć w komponencie nadrzędnym
export const useHomeZone = (zones) => {
  const safeZones = Array.isArray(zones) ? zones : [];
  return useMemo(() => safeZones.find(z => z.is_home_zone), [safeZones]);
};

// Wydzielony komponent wiersza
const OrderRow = React.memo(({ order, index, style, columns, isSelected, onSelect, onContextMenu, onMouseEnter, onMouseLeave }) => {
  if (!order) return null;

  return (
    <Draggable draggableId={String(order.id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          style={{ ...provided.draggableProps.style, ...style }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`planit-grid-row ${isSelected ? 'highlighted-row' : ''}`}
          onClick={(e) => onSelect(e, order.id)}
          onContextMenu={(e) => onContextMenu(e, order.id)}
          onMouseEnter={(e) => onMouseEnter(e, order)}
          onMouseLeave={onMouseLeave}
          role="button"
          tabIndex={0}
          aria-selected={isSelected}
        >
          {Array.isArray(columns) && columns.map((col, i) => (
            <div key={`${order.id}-${i}`} className="planit-grid-cell">
              {col.accessor ? col.accessor(order) : '-'}
            </div>
          ))}
        </div>
      )}
    </Draggable>
  );
});

OrderRow.displayName = 'OrderRow';

const PlanItOrders = ({ orders, zones = [], homeZone, onPopOut }) => {
  // ⚠️ ZABEZPIECZENIE - orders ZAWSZE POWINNO BYĆ TABLICĄ
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Pobieramy stan i funkcje z kontekstu
  const { selectedOrderIds, setSelectedOrderIds, setContextMenu } = usePlanIt();

  const [activeTab, setActiveTab] = useState('delivery');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: null,
    position: { x: 0, y: 0 },
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const listContainerRef = useRef(null);

  useEffect(() => {
    if (listContainerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setSize({ width, height });
        }
      });
      resizeObserver.observe(listContainerRef.current);
      return () => resizeObserver.disconnect();
    }
    return () => setTooltip({ visible: false, content: null, position: { x: 0, y: 0 } });
  }, []);

  const allColumns = [
    { header: 'Consignment #', accessor: (order) => order?.order_number || order?.customer_reference || `ID: ${order?.id}` || 'N/A' },
    { header: 'Loading Company', accessor: (order) => order?.sender_details?.name || '-' },
    { header: 'Loading Address', accessor: (order) => order?.sender_details?.address1 || '-' },
    { header: 'Loading PC', accessor: (order) => order?.sender_details?.postCode || '-' },
    { header: 'Unloading Company', accessor: (order) => order?.recipient_details?.name || '-' },
    { header: 'Unloading Address', accessor: (order) => order?.recipient_details?.address1 || '-' },
    { header: 'Unloading PC', accessor: (order) => order?.recipient_details?.postCode || '-' },
    { header: 'Weight', accessor: (order) => order?.totalKilos > 0 ? order.totalKilos : '-' },
    { header: 'Spaces', accessor: (order) => order?.totalSpaces > 0 ? order.totalSpaces : '-' },
  ];

  const columns = useMemo(() => {
    if (activeTab === 'delivery') {
      return [allColumns[0], ...allColumns.slice(4)];
    }
    return [...allColumns.slice(0, 4), ...allColumns.slice(7)];
  }, [activeTab]);

  // ⚠️ ZABEZPIECZENIE - używamy safeOrders zamiast orders
  const allEnrichedOrders = useMemo(() => {
    return safeOrders.map(order => {
      const cargo = order?.cargo_details || {};
      const totalKilos = cargo.total_kilos || 0;
      const totalSpaces = cargo.total_spaces || 0;
      return { ...order, totalKilos, totalSpaces };
    });
  }, [safeOrders]);

  const filteredOrders = useMemo(() => {
    const isDateInRange = (order) => {
      const { start, end } = dateRange;
      if (!start || !end) return true;

      const dateField = activeTab === 'collections' ? order?.loading_date_time : order?.unloading_date_time;
      if (!dateField) return false;
      try {
        const orderDate = new Date(dateField).toISOString().split('T')[0];
        if (isNaN(new Date(orderDate).getTime())) return false;
        return orderDate >= start && orderDate <= end;
      } catch (error) {
        console.warn('Invalid date format encountered during filtering:', dateField);
        return false;
      }
    };

    const dateFilteredOrders = allEnrichedOrders.filter(isDateInRange);

    if (activeTab === 'delivery') {
      if (!homeZone) return [];
      return dateFilteredOrders.filter(order => 
        order?.recipient_details?.postCode && isPostcodeInZone(order.recipient_details.postCode, homeZone)
      );
    }
    
    if (activeTab === 'collections') {
      if (!homeZone) return dateFilteredOrders;
      return dateFilteredOrders.filter(order => 
        order?.sender_details?.postCode && isPostcodeInZone(order.sender_details.postCode, homeZone)
      );
    }
    return dateFilteredOrders;
  }, [activeTab, allEnrichedOrders, homeZone, dateRange]);

  // ⚠️ ZABEZPIECZENIE - filteredOrders może być undefined
  const safeFilteredOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

  const handleClick = useCallback((e, clickedOrderId) => {
    const { ctrlKey, metaKey } = e;

    if (ctrlKey || metaKey) {
      setSelectedOrderIds(prev =>
        Array.isArray(prev) && prev.includes(clickedOrderId)
          ? prev.filter(id => id !== clickedOrderId)
          : [...(Array.isArray(prev) ? prev : []), clickedOrderId]
      );
    } else {
      setSelectedOrderIds([clickedOrderId]);
    }
  }, [setSelectedOrderIds]);

  const handleContextMenu = useCallback((e, orderId) => {
    e.preventDefault();
    const currentSelectedIds = Array.isArray(selectedOrderIds) ? selectedOrderIds : [];
    if (!currentSelectedIds.includes(orderId)) {
      setSelectedOrderIds([orderId]);
    }
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, [selectedOrderIds, setSelectedOrderIds, setContextMenu]);

  const handleMouseEnter = useCallback((e, order) => {
    if (!order) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      content: (
        <>
          <strong>Loading:</strong> {order.sender_details?.name || '-'}, {order.sender_details?.address1 || '-'}, {order.sender_details?.postCode || '-'}
          <br />
          <strong>Unloading:</strong> {order.recipient_details?.name || '-'}, {order.recipient_details?.address1 || '-'}, {order.recipient_details?.postCode || '-'}
        </>
      ),
      position: { x: rect.left, y: rect.bottom },
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip({ visible: false, content: null, position: { x: 0, y: 0 } });
  }, []);

  return (
    <div className="card planit-section">
      <div className="planit-section-header">
        <h3>Available Orders</h3>
        <div className="tabs-container">
          <button className={`tab-button ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')}>Delivery</button>
          <button className={`tab-button ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => setActiveTab('collections')}>Collections</button>
        </div>
        <div className="form-group" style={{ margin: '0 0 0 1rem', minWidth: '160px' }}>
          <label style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>From Date</label>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
        </div>
        <div className="form-group" style={{ margin: '0 0 0 1rem', minWidth: '160px' }}>
          <label style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>To Date</label>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
        </div>
      </div>
      <div className="planit-list planit-table-grid">
        {/* Nagłówek siatki */}
        <div className="planit-grid-header">
          {Array.isArray(columns) && columns.map(col => 
            <div key={col.header}>{col.header}</div>
          )}
        </div>
        <div className="planit-grid-body" ref={listContainerRef}>
          <Droppable
            droppableId="orders"
            mode="virtual"
            renderClone={(provided, snapshot, rubric) => {
              const order = safeFilteredOrders[rubric.source.index];
              if (!order) return null;
              return (
                <OrderRow
                  order={order}
                  index={rubric.source.index}
                  style={{ margin: 0 }}
                  columns={columns}
                  isSelected={true}
                  onSelect={() => {}}
                  onContextMenu={() => {}}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                />
              );
            }}
          >
            {(provided) => (
              <FixedSizeList
                height={size.height || 400}
                itemCount={safeFilteredOrders.length}
                itemSize={40}
                width={size.width || 800}
                outerRef={provided.innerRef}
              >
                {({ index, style }) => {
                  const order = safeFilteredOrders[index];
                  if (!order) return null;
                  return (
                    <OrderRow
                      order={order}
                      index={index}
                      style={style}
                      columns={columns}
                      isSelected={Array.isArray(selectedOrderIds) && selectedOrderIds.includes(order.id)}
                      onSelect={handleClick}
                      onContextMenu={handleContextMenu}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                }}
              </FixedSizeList>
            )}
          </Droppable>
        </div>
        {tooltip.visible && (
          <div 
            className="tooltip"
            style={{ top: tooltip.position.y + 15, left: tooltip.position.x + 15 }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PlanItOrders);