// src/components/shared/DataTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  RefreshCcw,
  Search,
} from 'lucide-react';

import SkeletonRow from '@/components/shared/SkeletonRow.jsx';
import { useTableData } from '@/hooks/useTableData';

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
  filterPlaceholder = 'Search…',
  initialSortKey,
  filterKeys = [],
  currentUser,
  isLoading = false,
  loadingText = 'Loading...',
  onContextMenu,
  footerData = {},
  autoRefreshEnabled = false,
}) => {
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

  const hasActions =
    onEdit ||
    onDelete ||
    (Array.isArray(customActions) && customActions.length > 0);

  const refreshFn = typeof onRefresh === 'function' ? onRefresh : null;

  /* ---------------------------------------
     Debounce search input
  --------------------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterText(inputValue);
    }, 250);
    return () => clearTimeout(timer);
  }, [inputValue]);

  /* ---------------------------------------
     Auto-refresh (PlanIt compatibility)
  --------------------------------------- */
  useEffect(() => {
    if (!autoRefreshEnabled || !refreshFn) return;

    const interval = setInterval(() => {
      refreshFn();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshFn]);

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return null;

    return sortConfig?.direction === 'ascending' ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  const getAriaSort = (colKey) => {
    if (sortConfig?.key !== colKey) return 'none';
    return sortConfig?.direction === 'ascending'
      ? 'ascending'
      : 'descending';
  };

  /* ---------------------------------------
     MAIN RENDER
  --------------------------------------- */
  return (
    <div className="table-shell">

      {/* Header & Search */}
      <div className="table-toolbar modern-toolbar">
        <div>
          <h2 className="table-title">
            {title}
            <span className="table-count">({safeSortedData.length})</span>
          </h2>
        </div>

        <div className="table-actions modern-actions">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={filterPlaceholder}
              aria-label="Search table"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="filter-input modern-input"
            />
          </div>

          {refreshFn && (
            <button
              type="button"
              onClick={refreshFn}
              className="btn-icon"
              title="Refresh now"
              disabled={isLoading}
              aria-label="Refresh data"
            >
              <RefreshCcw
                size={18}
                className={isLoading ? 'animate-spin' : ''}
              />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table modern-table">
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
                      className="table-sort-button modern-sort-button"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.icon && <span className="col-icon">{col.icon}</span>}
                      <span>{col.header}</span>
                      <span className="sort-icon">{getSortIcon(col.key)}</span>
                    </button>
                  ) : (
                    <span className="col-header">{col.header}</span>
                  )}
                </th>
              ))}

              {hasActions && <th className="actions-header">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow
                  key={`loading-${i}`}
                  columns={safeColumns}
                  hasActions={hasActions}
                />
              ))}

            {!isLoading &&
              safeSortedData.map((item) => {
                const isCurrentUserRow = currentUser?.id === item.id;

                return (
                  <tr
                    key={item.id ?? crypto.randomUUID()}
                    onContextMenu={
                      onContextMenu ? (e) => onContextMenu(e, item) : undefined
                    }
                  >
                    {safeColumns.map((col) => (
                      <td key={`${item.id}-${col.key}`}>
                        {col.render
                          ? col.render(item)
                          : getNestedValue(item, col.key)}
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
                                aria-label="Edit item"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}

                            {onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(item)}
                                className="btn-icon btn-danger"
                                aria-label="Delete item"
                                title="Delete"
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
                    {footerData[col.key] ? (
                      <strong>{footerData[col.key]}</strong>
                    ) : null}
                  </td>
                ))}
                {hasActions && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>

        {!isLoading && safeSortedData.length === 0 && (
          <p className="no-results-message table-empty-state">
            {filterText
              ? 'No results match your search.'
              : 'No records available.'}
          </p>
        )}
      </div>
    </div>
  );
};

DataTable.propTypes = {
  items: PropTypes.array,
  columns: PropTypes.array,
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
