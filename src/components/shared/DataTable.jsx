// DataTable.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowUp, ArrowDown, Edit, Trash2, RefreshCcw, RefreshCw } from 'lucide-react';
import SkeletonRow from '@/components/shared/SkeletonRow.jsx';
import { useTableData } from '@/hooks/useTableData';

const getNestedValue = (obj, path) => {
  if (!obj || !path || typeof obj !== 'object') return undefined;
  try {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  } catch (error) {
    console.warn('Error accessing nested value:', { path, obj, error });
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
  filterPlaceholder = "Search...",
  initialSortKey,
  filterKeys = [],
  currentUser,
  isLoading = false,
  loadingText = "Loading...",
  onContextMenu,
  footerData = {},
  autoRefreshEnabled = false // Przyjmujemy stan z zewnątrz
}) => {
  if (!Array.isArray(columns)) {
    console.error('DataTable: columns must be an array');
    return null;
  }

  const safeItems = Array.isArray(items) ? items : [];

  const {
    sortedAndFilteredData,
    sortConfig,
    filterText,
    setFilterText,
    handleSort,
  } = useTableData(safeItems, {
    initialSortKey,
    filterKeys,
  });

  const safeSortedData = Array.isArray(sortedAndFilteredData)
    ? sortedAndFilteredData
    : [];

  const [inputValue, setInputValue] = useState(filterText);

  // 🔍 Debouncing filtra
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterText(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, setFilterText]);

  // 🕐 Auto-refresh co X sekund
  useEffect(() => {
    if (!autoRefreshEnabled || !onRefresh) return;

    const interval = setInterval(() => {
      console.log('🔁 Auto refresh triggered');
      onRefresh();
    }, 30000); // 30 sekund

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, onRefresh]);

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending'
        ? <ArrowUp size={14} />
        : <ArrowDown size={14} />;
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{title} ({safeSortedData?.length ?? 0})</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="text"
            placeholder={filterPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="filter-input"
          />

          {/* 🔄 Manual refresh */}
          {onRefresh && (
            <button onClick={onRefresh} className="btn-icon" title="Refresh now" disabled={isLoading}>
              <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}

        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortConfig.key === col.key
                      ? sortConfig.direction === 'ascending'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {col.icon}
                    <span>{col.header}</span>
                    {col.sortable && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || (Array.isArray(customActions) && customActions.length > 0)) && (
                <th>Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow
                  key={i}
                  columns={columns}
                  hasActions={onEdit || onDelete || (Array.isArray(customActions) && customActions.length > 0)}
                />
              ))
            ) : safeSortedData.length > 0 ? (
              safeSortedData.map((item) => (
                <tr
                  key={item.id}
                  onContextMenu={onContextMenu ? (e) => onContextMenu(e, item) : undefined}
                  style={onContextMenu ? { cursor: 'context-menu' } : {}}
                >
                  {columns.map((col) => (
                    <td key={`${item.id}-${col.key}`}>
                      {col.render ? col.render(item) : getNestedValue(item, col.key)}
                    </td>
                  ))}
                  {(onEdit || onDelete || (Array.isArray(customActions) && customActions.length > 0)) && (
                    <td className="actions-cell">
                      {currentUser && currentUser.id === item.id ? (
                        <span className="text-muted" aria-label="Current user">This is you</span>
                      ) : (
                        <>
                          {onEdit && (
                            <button onClick={() => onEdit(item)} className="btn-icon" title="Edit">
                              <Edit size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button onClick={() => onDelete(item)} className="btn-icon btn-danger" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                      {customActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => action.onClick(item)}
                          className="btn-icon"
                          title={action.title}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </td>
                  )}
                </tr>
              ))
            ) : null}
          </tbody>

          {footerData && (
            <tfoot>
              <tr>
                {columns.map((col) => (
                  <td key={`footer-${col.key}`}>
                    {footerData?.[col.key] ? (
                      <strong>{footerData[col.key]}</strong>
                    ) : null}
                  </td>
                ))}
                {(onEdit || onDelete || (Array.isArray(customActions) && customActions.length > 0)) && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>

        {!isLoading && safeSortedData.length === 0 && (
          <p className="no-results-message" aria-live="polite">
            {filterText ? 'No results match the search criteria.' : 'No data in the database.'}
          </p>
        )}
      </div>
    </div>
  );
};

DataTable.propTypes = {
  items: PropTypes.array,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    header: PropTypes.string.isRequired,
    sortable: PropTypes.bool,
    render: PropTypes.func,
    icon: PropTypes.node,
  })),
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
  autoRefreshEnabled: PropTypes.bool, // Dodajemy prop do walidacji
};

export default DataTable;
// ostatnia zmiana (04.11.2025)
