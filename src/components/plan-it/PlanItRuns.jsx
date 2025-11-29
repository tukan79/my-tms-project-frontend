// src/components/plan-it/PlanItRuns.jsx

import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Edit,
  Trash2,
  Weight,
  LayoutGrid as PalletIcon,
  Plus,
} from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';

/* -------------------- CapacityIndicator -------------------- */

const CapacityIndicator = ({ current, max, label, icon }) => {
  if (max === null || max === undefined) return null;

  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isOverloaded = percentage > 100;

  return (
    <div className="capacity-indicator">
      <div className="capacity-text">
        {icon}
        <span>
          {label}: {current} / {max}
        </span>
      </div>

      <div className="capacity-bar-container">
        <div
          className={`capacity-bar ${isOverloaded ? 'overloaded' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

CapacityIndicator.propTypes = {
  current: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string.isRequired,
  icon: PropTypes.node,
};

CapacityIndicator.defaultProps = {
  max: null,
  icon: null,
};

/* -------------------- PlanItRuns -------------------- */

const PlanItRuns = ({
  runs = [],
  onPopOut,
  onDelete,
  onEdit,
  handleAddNewRun,
  selectedDate,
  onDateChange,
  activeRunId,
  onRunSelect,
  isLoading,
}) => {
  const handleDelete = useCallback(
    (event, run) => {
      event.stopPropagation();
      onDelete(run);
    },
    [onDelete]
  );

  const handleEdit = useCallback(
    (event, run) => {
      event.stopPropagation();
      onEdit(run);
    },
    [onEdit]
  );

  const handleRunClick = useCallback(
    (id) => {
      onRunSelect(id);
    },
    [onRunSelect]
  );

  let runsContent;

  if (isLoading) {
    runsContent = (
      <div className="loading" style={{ padding: '2rem' }}>
        Loading runs...
      </div>
    );
  } else if (runs.length === 0) {
    runsContent = (
      <p className="no-results-message" style={{ padding: '2rem' }}>
        No runs found for the selected date.
      </p>
    );
  } else {
    runsContent = runs.map((run) => (
      <Droppable key={run.id} droppableId={String(run.id)}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`planit-list-item droppable-combination with-actions ${
              run.id === activeRunId ? 'active-run' : ''
            }`}
          >
            <button
              type="button"
              className="planit-item-text"
              aria-pressed={run.id === activeRunId}
              onClick={() => handleRunClick(run.id)}
              style={{
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                padding: 0,
                flex: 1,
                cursor: 'pointer',
              }}
            >
              <span>{run.displayText}</span>

              {run.hasCapacity && (
                <div className="run-capacity-details">
                  <CapacityIndicator
                    current={run.totalKilos}
                    max={run.maxPayload}
                    label="kg"
                    icon={<Weight size={14} />}
                  />

                  <CapacityIndicator
                    current={run.totalSpaces}
                    max={run.maxPallets}
                    label="spaces"
                    icon={<PalletIcon size={14} />}
                  />
                </div>
              )}

              {!run.hasCapacity && (
                <div
                  className="run-stats"
                  style={{ marginTop: '0.5rem' }}
                >
                  <span>
                    <Weight size={14} /> {run.totalKilos || 0} kg
                  </span>
                  <span>
                    <PalletIcon size={14} /> {run.totalSpaces || 0}{' '}
                    spaces
                  </span>
                </div>
              )}
            </button>

            <div className="planit-item-actions">
              <button
                type="button"
                className="btn-icon"
                title="Edit Run"
                onClick={(e) => handleEdit(e, run)}
              >
                <Edit size={16} />
              </button>

              <button
                type="button"
                className="btn-icon btn-danger"
                title="Delete Run"
                onClick={(e) => handleDelete(e, run)}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ));
  }

  return (
    <div className="card planit-section">
      <div className="planit-section-header">
        <h3>Available Runs</h3>

        <div
          className="form-group"
          style={{ margin: 0, minWidth: '160px' }}
        >
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleAddNewRun}
          className="btn-primary"
          style={{ marginLeft: 'auto' }}
        >
          <Plus size={16} /> Add Run
        </button>
      </div>

      <div className="planit-list">{runsContent}</div>
    </div>
  );
};

/* -------------------- PropTypes -------------------- */

PlanItRuns.propTypes = {
  runs: PropTypes.arrayOf(PropTypes.object),
  onPopOut: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  handleAddNewRun: PropTypes.func.isRequired,
  selectedDate: PropTypes.string.isRequired,
  onDateChange: PropTypes.func.isRequired,
  activeRunId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRunSelect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

PlanItRuns.defaultProps = {
  runs: [],
  onPopOut: null,
  activeRunId: null,
  isLoading: false,
};

export default memo(PlanItRuns);
