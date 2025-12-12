import React from "react";
import PropTypes from "prop-types";

/**
 * Modern SaaS Skeleton Row
 * - Elegant shimmer effect
 * - Fully accessible
 * - Works in light/dark mode
 * - Automatically adapts to number of columns
 */
const SkeletonRow = ({ columns = [], hasActions, rows = 1 }) => {
  const safeColumns = Array.isArray(columns) ? columns : [];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={`skeleton-row-${rowIndex}`}
          aria-busy="true"
          aria-label="Loading row"
          className="skeleton-row"
        >
          {safeColumns.map((col) => (
            <td key={`${col.key}-${rowIndex}`}>
              <div className="skeleton-block shimmer" />
            </td>
          ))}

          {hasActions && (
            <td className="actions-cell">
              <div className="skeleton-block shimmer action-skeleton" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

SkeletonRow.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
    })
  ),
  hasActions: PropTypes.bool,
  rows: PropTypes.number,
};

SkeletonRow.defaultProps = {
  columns: [],
  hasActions: false,
  rows: 1,
};

export default SkeletonRow;
