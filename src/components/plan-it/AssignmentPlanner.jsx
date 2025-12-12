// src/components/list/AssignmentPlanner.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

import api from "@/services/api.js";
import { Trash2 } from "lucide-react";

/* Safer confirm helper */
const confirmAction = (message) => {
  if (typeof globalThis.confirm === "function") {
    return globalThis.confirm(message);
  }
  return false;
};

const AssignmentPlanner = ({
  orders = [],
  combinations = [],
  drivers = [],
  trucks = [],
  assignments = [],
  onAssignmentChange,
}) => {
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedCombination, setSelectedCombination] = useState("");
  const [notes, setNotes] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -----------------------------------------------
     AVAILABLE ORDERS
  ------------------------------------------------ */
  const availableOrders = useMemo(() => {
    return Array.isArray(orders)
      ? orders.filter((order) => order.status === "nowe")
      : [];
  }, [orders]);

  /* -----------------------------------------------
     COMBINATIONS → ENRICH (Driver + Truck)
  ------------------------------------------------ */
  const enrichedCombinations = useMemo(() => {
    return combinations.map((combo) => {
      const truck = trucks.find((t) => t.id === combo.truck_id);
      const driver = drivers.find((d) => d.id === combo.driver_id);

      const driverName = driver
        ? `${driver.first_name} ${driver.last_name}`
        : "Unknown Driver";

      const truckText = truck
        ? `${truck.brand} ${truck.model} (${truck.registration_plate})`
        : "No Vehicle";

      return {
        ...combo,
        displayText: `${driverName} — ${truckText}`,
      };
    });
  }, [combinations, trucks, drivers]);

  /* -----------------------------------------------
     ASSIGNMENTS → ENRICH FOR TABLE
  ------------------------------------------------ */
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

      return {
        ...assignment,
        order_number: order?.order_number || `Order #${assignment.order_id}`,
        route: `${order?.sender_details?.city || "?"} → ${
          order?.recipient_details?.city || "?"
        }`,
        driver_name: driver
          ? `${driver.first_name} ${driver.last_name}`
          : "No driver",
        truck_plate: truck?.registration_plate || "No vehicle",
      };
    });
  }, [assignments, orders, combinations, drivers, trucks]);

  /* -----------------------------------------------
     SUBMIT HANDLER
  ------------------------------------------------ */
  const handleSubmit = async () => {
    if (!selectedOrder || !selectedCombination) {
      setError("Please select an order and a combination.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post("/api/assignments", {
        order_id: Number(selectedOrder),
        combination_id: Number(selectedCombination),
        notes,
      });

      onAssignmentChange();
      setSelectedOrder("");
      setSelectedCombination("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Error creating assignment.");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------
     DELETE ASSIGNMENT
  ------------------------------------------------ */
  const handleDeleteAssignment = async (id) => {
    const ok = confirmAction("Delete this assignment?");
    if (!ok) return;

    try {
      await api.delete(`/api/assignments/${id}`);
      onAssignmentChange();
    } catch (err) {
      setError(err.response?.data?.error || "Error deleting assignment.");
    }
  };

  /* -----------------------------------------------
     AUTO REFRESH
  ------------------------------------------------ */
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await onAssignmentChange();
    setIsRefreshing(false);
  }, [onAssignmentChange]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  /* -----------------------------------------------
     RENDER
  ------------------------------------------------ */
  return (
    <div className="card assignment-planner">

      {/* HEADER */}
      <div className="card-header">
        <h2>Assignment Planner</h2>
        <p className="text-muted small">
          Assign orders to driver + vehicle combinations.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ------------------- TOP SECTION ------------------- */}
      <div className="planner-top">
        {/* AUTO REFRESH */}
        <div className="auto-refresh">
          <label className="switch">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh((p) => !p)}
            />
            <span className="slider" />
          </label>

          <span className="auto-refresh-label">
            Auto Refresh: {autoRefresh ? "ON" : "OFF"}
          </span>

          {isRefreshing && <span className="refreshing">⟳ refreshing…</span>}
        </div>

        {/* COMBO SELECT */}
        <div className="form-group">
          <label>Available Combinations</label>
          <select
            className="input"
            value={selectedCombination}
            onChange={(e) => setSelectedCombination(e.target.value)}
          >
            <option value="">Select a combination…</option>
            {enrichedCombinations.map((combo) => (
              <option key={combo.id} value={combo.id}>
                {combo.displayText}
              </option>
            ))}
          </select>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          className="btn-primary"
          disabled={!selectedOrder || !selectedCombination || loading}
          onClick={handleSubmit}
        >
          {loading ? "Assigning…" : "Assign"}
        </button>
      </div>

      {/* ------------------- ORDERS TABLE ------------------- */}
      <h3 className="section-title">Available Orders (new)</h3>

      <div className="table-container-scrollable">
        <table className="data-table selectable-table">
          <thead>
            <tr>
              <th>Consignment #</th>
              <th>Loading Company</th>
              <th>PC</th>
              <th>Unloading Company</th>
              <th>PC</th>
              <th>Weight</th>
              <th>Spaces</th>
            </tr>
          </thead>

          <tbody>
            {availableOrders.map((order) => {
              const isSelected = selectedOrder === String(order.id);
              const cargo = order.cargo_details || {};

              return (
                <tr key={order.id} className={isSelected ? "selected-row" : ""}>
                  <td>
                    <button
                      className="row-select-button"
                      onClick={() => setSelectedOrder(String(order.id))}
                    >
                      {order.order_number || "-"}
                    </button>
                  </td>
                  <td>{order.sender_details?.name || "-"}</td>
                  <td>{order.sender_details?.postCode || "-"}</td>
                  <td>{order.recipient_details?.name || "-"}</td>
                  <td>{order.recipient_details?.postCode || "-"}</td>
                  <td>{cargo.total_kilos || 0}</td>
                  <td>{cargo.total_spaces || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ------------------- NOTES ------------------- */}
      <div className="form-group" style={{ marginTop: "1rem" }}>
        <label>Notes for Driver (optional)</label>
        <textarea
          className="input"
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Gate code, special instructions…"
        />
      </div>

      {/* ------------------- ASSIGNMENTS LIST ------------------- */}
      <h3 className="section-title" style={{ marginTop: "2rem" }}>
        Scheduled Assignments
      </h3>

      {enrichedAssignments.length === 0 ? (
        <p className="text-muted">No scheduled assignments.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Route</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {enrichedAssignments.map((a) => (
              <tr key={a.id}>
                <td>{a.order_number}</td>
                <td>{a.route}</td>
                <td>{a.driver_name}</td>
                <td>{a.truck_plate}</td>
                <td>{a.notes || "-"}</td>

                <td className="actions-cell">
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDeleteAssignment(a.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
