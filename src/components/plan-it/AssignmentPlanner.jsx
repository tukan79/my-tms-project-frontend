import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '@/services/api';
import { Trash2 } from 'lucide-react';

const AssignmentPlanner = ({
  orders = [],
  combinations = [],
  drivers = [],
  trucks = [],
  assignments = [],
  onAssignmentChange,
}) => {
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedCombination, setSelectedCombination] = useState('');
  const [notes, setNotes] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================== MEMO ================== */

  const availableOrders = useMemo(() => {
    return Array.isArray(orders)
      ? orders.filter((order) => order.status === 'nowe')
      : [];
  }, [orders]);

  const enrichedCombinations = useMemo(() => {
    return combinations.map((combo) => {
      const truck = trucks.find((t) => t.id === combo.truck_id);
      const driver = drivers.find((d) => d.id === combo.driver_id);

      const driverName = driver
        ? `${driver.first_name} ${driver.last_name}`
        : '';

      const truckText = truck
        ? `${truck.brand} ${truck.model} (${truck.registration_plate})`
        : '';

      return {
        ...combo,
        displayText: `${driverName} - ${truckText}`.trim(),
      };
    });
  }, [combinations, trucks, drivers]);

  const enrichedAssignments = useMemo(() => {
    return assignments.map((assignment) => {
      const order = orders.find((o) => o.id === assignment.order_id);
      const combination = combinations.find((c) => c.id === assignment.combination_id);

      const driver = combination
        ? drivers.find((d) => d.id === combination.driver_id)
        : null;

      const truck = combination
        ? trucks.find((t) => t.id === combination.truck_id)
        : null;

      const driverName = driver
        ? `${driver.first_name} ${driver.last_name}`
        : 'No driver';

      return {
        ...assignment,
        order_number: order?.order_number || `ID: ${assignment.order_id}`,
        route: `${order?.sender_details?.city || '?'} → ${order?.recipient_details?.city || '?'}`,
        driver_name: driverName,
        truck_plate: truck?.registration_plate || 'No vehicle',
      };
    });
  }, [assignments, orders, combinations, drivers, trucks]);

  /* ================== HANDLERS ================== */

  const handleSubmit = async () => {
    if (!selectedOrder || !selectedCombination) {
      setError('Please select an order and a combination.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/api/assignments', {
        order_id: Number(selectedOrder),
        combination_id: Number(selectedCombination),
        notes,
      });

      onAssignmentChange();
      setSelectedOrder('');
      setSelectedCombination('');
      setNotes('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const confirmed = globalThis.confirm(
      'Are you sure you want to delete this assignment?'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/api/assignments/${assignmentId}`);
      onAssignmentChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting assignment.');
    }
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onAssignmentChange();
    } finally {
      setIsRefreshing(false);
    }
  }, [onAssignmentChange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  /* ================== RENDER ================== */

  return (
    <div className="card">
      <h2>Assignment Planner</h2>

      {error && <div className="error-message">{error}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'end' }}>
        <div className="form-group" style={{ flex: 3 }}>
          <div className="auto-refresh-control">
            <label htmlFor="autoRefreshToggle" className="switch">
  <span className="sr-only">Toggle auto refresh</span>
  <input
    id="autoRefreshToggle"
    type="checkbox"
    checked={autoRefresh}
    onChange={() => setAutoRefresh((prev) => !prev)}
  />
  <span className="slider" />
</label>

            <span style={{ marginLeft: '0.5rem' }}>
              Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
            </span>

            {isRefreshing && (
              <span style={{ marginLeft: '1rem', color: 'gray' }}>
                ⟳ refreshing...
              </span>
            )}
          </div>

          <label htmlFor="ordersTable">Available Orders (status: new)</label>

          <div id="ordersTable" className="table-container-scrollable">
            <table className="data-table selectable-table">
              <thead>
                <tr>
                  <th>Consignment #</th>
                  <th>Loading Company</th>
                  <th>Loading PC</th>
                  <th>Unloading Company</th>
                  <th>Unloading PC</th>
                  <th>Weight</th>
                  <th>Spaces</th>
                </tr>
              </thead>
              <tbody>
                {availableOrders.map((order) => {
                  const isSelected = selectedOrder === String(order.id);

                  return (
                    <tr key={order.id} className={isSelected ? 'selected-row' : ''}>
                      <td>
                        <button
                          type="button"
                          className="row-select-button"
                          onClick={() => setSelectedOrder(String(order.id))}
                          aria-label={`Select order ${order.order_number || order.id}`}
                        >
                          {order.order_number || '-'}
                        </button>
                      </td>
                      <td>{order.sender_details?.name || '-'}</td>
                      <td>{order.sender_details?.postCode || '-'}</td>
                      <td>{order.recipient_details?.name || '-'}</td>
                      <td>{order.recipient_details?.postCode || '-'}</td>
                      <td>{order.cargo_details?.kilos || '-'}</td>
                      <td>{order.cargo_details?.spaces || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="comboSelect">Available Combinations</label>
          <select
            id="comboSelect"
            value={selectedCombination}
            onChange={(e) => setSelectedCombination(e.target.value)}
            required
          >
            <option value="">Select a combination...</option>
            {enrichedCombinations.map((combo) => (
              <option key={combo.id} value={combo.id}>
                {combo.displayText}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="btn-primary"
          disabled={loading || !selectedOrder || !selectedCombination}
        >
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="notesField">Notes for Driver (optional)</label>
        <textarea
          id="notesField"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="3"
          placeholder="E.g. gate code, reference..."
        />
      </div>

      <h3 style={{ marginTop: '2rem' }}>Scheduled Assignments</h3>

      <div className="list">
        {enrichedAssignments.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrichedAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.order_number}</td>
                  <td>{assignment.route}</td>
                  <td>{assignment.driver_name}</td>
                  <td>{assignment.truck_plate}</td>
                  <td>{assignment.notes || '-'}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="btn-icon btn-danger"
                      title="Delete assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No scheduled assignments.</p>
        )}
      </div>
    </div>
  );
};

AssignmentPlanner.propTypes = {
  orders: PropTypes.array,
  combinations: PropTypes.array,
  drivers: PropTypes.array,
  trucks: PropTypes.array,
  assignments: PropTypes.array,
  onAssignmentChange: PropTypes.func.isRequired,
};

export default AssignmentPlanner;
