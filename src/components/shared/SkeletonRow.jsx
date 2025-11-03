import React from 'react';

const SkeletonRow = ({ columns, hasActions }) => {
const SkeletonRow = ({ columns = [], hasActions }) => {
  // Zabezpieczenie: Gwarantujemy, że `columns` jest zawsze tablicą,
  // nawet jeśli props jest `null` lub `undefined`.
  const safeColumns = Array.isArray(columns) ? columns : [];
  return (
    <tr aria-busy="true">
      {columns.map((col) => (
      {safeColumns.map((col) => (
        <td key={col.key}>
          <div className="skeleton-cell" />
        </td>
      ))}
      {hasActions && (
        <td className="actions-cell">
          <div className="skeleton-cell" />
        </td>
      )}
    </tr>
  );
};

export default SkeletonRow;
// ostatnia zmiana (30.05.2024, 13:14:12)