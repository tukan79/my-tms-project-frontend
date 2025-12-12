// src/components/plan-it/PlanItAssignments.jsx

import React from "react";
import PropTypes from "prop-types";
import { ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { usePlanIt } from "@/contexts/PlanItContext.jsx";

/**
 * Modern SaaS UI — Assignments panel inside Plan-It
 */
const PlanItAssignments = ({
  assignments = [],
  onPopOut,
  onDeleteAssignment,
}) => {
  const { autoRefreshEnabled, setAutoRefreshEnabled } = usePlanIt();

  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  /* -----------------------------------------------------------
     ACTION HANDLERS
  ----------------------------------------------------------- */
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled((prev) => !prev);
  };

  const handlePopOut = () => {
    onPopOut?.("assignments");
  };

  const handleDelete = (id) => {
    onDeleteAssignment?.(id);
  };

  /* -----------------------------------------------------------
     RENDER HELPERS
  ----------------------------------------------------------- */
  const renderHeaderActions = () => (
    <div className="flex items-center gap-2 ml-auto">
      {/* Auto Refresh Toggle */}
      <button
        type="button"
        className="btn-icon"
        title={
          autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF"
        }
        onClick={toggleAutoRefresh}
      >
        <RefreshCw
          size={16}
          className={
            autoRefreshEnabled ? "text-green-500" : "text-gray-400"
          }
        />
      </button>

      {/* Open External */}
      <button
        type="button"
        className="btn-icon"
        title="Open in new window"
        onClick={handlePopOut}
      >
        <ExternalLink size={16} />
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="empty-state">
      <p className="text-muted">No assignments available.</p>
    </div>
  );

  const renderAssignments = () => (
    <ul className="planit-list modern-list">
      {safeAssignments.map((assignment) => (
        <li key={assignment.id} className="planit-list-item with-actions">
          <div className="planit-item-text">
            <strong className="font-medium">{assignment.order_number}</strong>
            <span className="mx-2 text-muted">→</span>
            <span>{assignment.run_text}</span>
          </div>

          <div className="planit-item-actions">
            <button
              type="button"
              className="btn-icon btn-danger"
              title="Delete assignment"
              onClick={() => handleDelete(assignment.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );

  /* -----------------------------------------------------------
     MAIN RENDER
  ----------------------------------------------------------- */
  return (
    <div className="card planit-assignments-panel">

      {/* HEADER */}
      <div className="card-header flex items-center gap-3">
        <div>
          <h3 className="card-title">Assigned Orders</h3>
          <p className="card-subtitle text-muted small">
            {safeAssignments.length} active assignments
          </p>
        </div>

        {renderHeaderActions()}
      </div>

      {/* CONTENT */}
      {safeAssignments.length === 0
        ? renderEmptyState()
        : renderAssignments()}
    </div>
  );
};

PlanItAssignments.propTypes = {
  assignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      order_number: PropTypes.string,
      run_text: PropTypes.string,
    })
  ),
  onPopOut: PropTypes.func,
  onDeleteAssignment: PropTypes.func,
};

export default PlanItAssignments;
