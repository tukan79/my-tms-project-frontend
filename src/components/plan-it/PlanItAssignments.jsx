import React from 'react';
import { ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { usePlanIt } from '@/contexts/PlanItContext.jsx'; // upewnij się, że ścieżka dobra

const PlanItAssignments = ({ assignments = [], onPopOut, onDeleteAssignment }) => {
  const { autoRefreshEnabled, setAutoRefreshEnabled } = usePlanIt();

  // Zabezpieczenie: Gwarantujemy, że `assignments` jest zawsze tablicą.
  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  return (
    <div className="card planit-assignments-panel">
      <div className="planit-section-header">
        <h3>Assigned Orders</h3>
        <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
          <button
            className={`btn-icon ${autoRefreshEnabled ? 'text-green-500' : 'text-gray-400'}`}
            title={autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF"}
            onClick={() => setAutoRefreshEnabled(prev => !prev)}
          >
            <RefreshCw size={16} />
          </button>

          <button
            className="btn-icon"
            title="Open in new window"
            onClick={() => onPopOut('assignments')}
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
      {safeAssignments.length === 0 ? (
        <p className="no-results-message" style={{ padding: '2rem' }}>No assignments available.</p>
      ) : (
        <ul className="planit-list">
          {safeAssignments.map((assignment) => (
            <li key={assignment.id} className="planit-list-item with-actions">
              <span className="planit-item-text">
                <strong>{assignment.order_number}</strong> → {assignment.run_text}
              </span>
              <div className="planit-item-actions">
                <button
                  className="btn-icon btn-danger"
                  title="Delete Assignment"
                  onClick={() => onDeleteAssignment?.(assignment.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlanItAssignments;
// ostatnia zmiana (30.05.2024, 13:14:12)