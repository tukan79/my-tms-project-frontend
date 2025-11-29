// src/components/shared/DataTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ArrowUp, ArrowDown, Edit, Trash2, RefreshCcw } from 'lucide-react';
import SkeletonRow from '@/components/shared/SkeletonRow.jsx';
import { useTableData } from '@/hooks/useTableData';

// ✅ Poprawione pod Sonar – optional chaining
const getNestedValue = (obj, path) => {
  try {
    return path?.split('.')?.reduce((acc, part) => acc?.[part], obj);
  } catch {
    return undefined;
  }
};

const DataTable = ({
  items = [],
  columns = [],
  onRefresh,
  onEdit,
  onDelete,
  title = '',
  customActions = [],
  filterPlaceholder = 'Search...',
  initialSortKey,
  filterKeys = [],
  currentUser,
  isLoading = false,
  loadingText = 'Loading...',
  onContextMenu,
  footerData = {},
  autoRefreshEnabled = false,
}) => {
  // ✅ Zawsze wywołuj hooki – bez warunków
  const safeItems = Array.isArray(items) ? items : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  const tableHook = useTableData(safeItems, { initialSortKey, filterKeys });

  const {
    sortedAndFilteredData = [],
    sortConfig = {},
    filterText = '',
    setFilterText = () => {},
    handleSort = () => {},
  } = tableHook ?? {};

  const [inputValue, setInputValue] = useState(filterText);

  const safeSortedData = useMemo(
    () => (Array.isArray(sortedAndFilteredData) ? sortedAndFilteredData : []),
    [sortedAndFilteredData]
  );

  const hasActions = Boolean(
    onEdit || onDelete || (Array.isArray(customActions) && customActions.length > 0)
  );

  const refreshFn = typeof onRefresh === 'function' ? onRefresh : null;

  // ✅ Debounce filtra
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterText(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, setFilterText]);

  // ✅ Auto refresh
  useEffect(() => {
    if (!autoRefreshEnabled || !refreshFn) return;

    const interval = setInterval(() => {
      refreshFn();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshFn]);

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig?.direction === 'ascending'
      ? <ArrowUp size={14} />
      : <ArrowDown size={14} />;
  };

  // ✅ Usunięty nested ternary
  const getAriaSort = (colKey) => {
    if (sortConfig?.key !== colKey) return 'none';
    return sortConfig?.direction === 'ascending'
      ? 'ascending'
      : 'descending';
  };

  return (
    <div className="table-shell">
      <div className="table-toolbar">
        <h2>{title} ({safeSortedData.length})</h2>

        <div className="table-actions">
          <input
            type="text"
            aria-label="Search table"
            placeholder={filterPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="filter-input"
          />

          {refreshFn && (
            <button
              type="button"
              onClick={refreshFn}
              className="btn-icon"
              title="Refresh now"
              disabled={isLoading}
              aria-label="Refresh data"
            >
              <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {safeColumns.map((col) => (
                <th
                  key={col.key}
                  aria-sort={col.sortable ? getAriaSort(col.key) : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="table-sort-button"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.icon}
                      <span>{col.header}</span>
                      {getSortIcon(col.key)}
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
              {hasActions && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow
                  key={`skeleton-${safeColumns.length}-${loadingText}-${i}`}
                  columns={safeColumns}
                  hasActions={hasActions}
                />
              ))
            )}

            {!isLoading && safeSortedData.length > 0 && safeSortedData.map((item) => {
              const isCurrentUserRow = currentUser?.id === item.id;

              return (
                <tr
                  key={item.id ?? `row-${crypto.randomUUID()}`}
                  onContextMenu={onContextMenu ? (e) => onContextMenu(e, item) : undefined}
                  style={onContextMenu ? { cursor: 'context-menu' } : undefined}
                >
                  {safeColumns.map((col) => (
                    <td key={`${item.id}-${col.key}`}>
                      {col.render ? col.render(item) : getNestedValue(item, col.key)}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="actions-cell">
                      {isCurrentUserRow ? (
                        <span className="text-muted">This is you</span>
                      ) : (
                        <>
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="btn-icon"
                              title="Edit"
                              aria-label="Edit item"
                            >
                              <Edit size={16} />
                            </button>
                          )}

                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="btn-icon btn-danger"
                              title="Delete"
                              aria-label="Delete item"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}

                      {(customActions ?? []).map((action) => (
                        <button
                          key={action.title}
                          type="button"
                          onClick={() => action.onClick(item)}
                          className="btn-icon"
                          title={action.title}
                          aria-label={action.title}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          {footerData && (
            <tfoot>
              <tr>
                {safeColumns.map((col) => (
                  <td key={`footer-${col.key}`}>
                    {footerData?.[col.key] ? <strong>{footerData[col.key]}</strong> : null}
                  </td>
                ))}
                {hasActions && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>

        {!isLoading && safeSortedData.length === 0 && (
          <p className="no-results-message" aria-live="polite">
            {filterText
              ? 'No results match the search criteria.'
              : 'No data in the database.'}
          </p>
        )}
      </div>
    </div>
  );
};

DataTable.propTypes = {
  items: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      render: PropTypes.func,
      icon: PropTypes.node,
    })
  ),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func,
  title: PropTypes.string,
  customActions: PropTypes.array,
  filterPlaceholder: PropTypes.string,
  initialSortKey: PropTypes.string,
  filterKeys: PropTypes.array,
  currentUser: PropTypes.object,
  onContextMenu: PropTypes.func,
  footerData: PropTypes.object,
  autoRefreshEnabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
};

export default DataTable;
