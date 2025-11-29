// src/components/plan-it/PlanItAssignments.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { usePlanIt } from '@/contexts/PlanItContext.jsx';

const PlanItAssignments = ({
  assignments = [],
  onPopOut,
  onDeleteAssignment,
}) => {
  const { autoRefreshEnabled, setAutoRefreshEnabled } = usePlanIt();

  const safeAssignments = Array.isArray(assignments)
    ? assignments
    : [];

  const handleToggleAutoRefresh = () => {
    setAutoRefreshEnabled((prev) => !prev);
  };

  const handlePopOut = () => {
    if (onPopOut) {
      onPopOut('assignments');
    }
  };

  const handleDelete = (id) => {
    if (onDeleteAssignment) {
      onDeleteAssignment(id);
    }
  };

  const renderHeaderActions = () => (
    <div
      className="flex items-center gap-2"
      style={{ marginLeft: 'auto' }}
    >
      <button
        type="button"
        className={`btn-icon ${
          autoRefreshEnabled ? 'text-green-500' : 'text-gray-400'
        }`}
        title={
          autoRefreshEnabled
            ? 'Auto-refresh ON'
            : 'Auto-refresh OFF'
        }
        aria-label="Toggle auto refresh"
        onClick={handleToggleAutoRefresh}
      >
        <RefreshCw size={16} />
      </button>

      <button
        type="button"
        className="btn-icon"
        title="Open in new window"
        aria-label="Open in new window"
        onClick={handlePopOut}
      >
        <ExternalLink size={16} />
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <p
      className="no-results-message"
      style={{ padding: '2rem' }}
    >
      No assignments available.
    </p>
  );

  const renderAssignments = () => (
    <ul className="planit-list">
      {safeAssignments.map((assignment) => (
        <li
          key={assignment.id}
          className="planit-list-item with-actions"
        >
          <span className="planit-item-text">
            <strong>{assignment.order_number}</strong>
            <span> → </span>
            <span>{assignment.run_text}</span>
          </span>

          <div className="planit-item-actions">
            <button
              type="button"
              className="btn-icon btn-danger"
              title="Delete Assignment"
              aria-label="Delete assignment"
              onClick={() => handleDelete(assignment.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="card planit-assignments-panel">
      <div className="planit-section-header">
        <h3>Assigned Orders</h3>
        {renderHeaderActions()}
      </div>

      {safeAssignments.length === 0
        ? renderEmptyState()
        : renderAssignments()}
    </div>
  );
};

PlanItAssignments.propTypes = {
  assignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      order_number: PropTypes.string,
      run_text: PropTypes.string,
    })
  ),
  onPopOut: PropTypes.func,
  onDeleteAssignment: PropTypes.func,
};

PlanItAssignments.defaultProps = {
  assignments: [],
  onPopOut: null,
  onDeleteAssignment: null,
};

export default PlanItAssignments;
