import React from 'react';
import PropTypes from 'prop-types';

const SkeletonRow = ({ columns = [], hasActions, rows = 1 }) => {
  // Zabezpieczenie: Gwarantujemy, że `columns` jest zawsze tablicą,
  // nawet jeśli props jest `null` lub `undefined`.
  const safeColumns = Array.isArray(columns) ? columns : [];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`skeleton-row-${rows}-${rowIndex}`} aria-busy="true" aria-label="Loading data">
          {safeColumns.map((col) => (
            <td key={`${col.key}-${rowIndex}`}>
              <div className="skeleton-cell shimmer" />
            </td>
          ))}
          {hasActions && (
            <td className="actions-cell">
              <div className="skeleton-cell shimmer" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

export default SkeletonRow;

SkeletonRow.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
    })
  ),
  hasActions: PropTypes.bool,
  rows: PropTypes.number,
};
// ostatnia zmiana (30.05.2024, 13:14:12)
