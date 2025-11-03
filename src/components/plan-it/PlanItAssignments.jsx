import React from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';

const PlanItAssignments = ({ assignments = [], onPopOut, onDeleteAssignment }) => {
  // Zabezpieczenie: Gwarantujemy, że `assignments` jest zawsze tablicą.
  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  return (
    <div className="card planit-assignments-panel">
      <div className="planit-section-header">
        <h3>Assigned Orders</h3>
        <button className="btn-icon" title="Open in new window" onClick={() => onPopOut('assignments')}>
          <ExternalLink size={16} />
        </button>
      </div>
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
                onClick={() => onDeleteAssignment(assignment.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanItAssignments;
// ostatnia zmiana (30.05.2024, 13:14:12)