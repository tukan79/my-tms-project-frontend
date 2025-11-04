// frontend/src/hooks/useTableData.js
import { useState, useMemo, useCallback } from 'react';

/**
 * Pobiera wartość z zagnieżdżonego obiektu według ścieżki (np. "user.address.city")
 */
const getNestedValue = (obj, path) => {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
};

/**
 * Hook do obsługi sortowania i filtrowania danych tabeli.
 * @param {Array} initialData - Dane źródłowe.
 * @param {object} options
 * @param {string} [options.initialSortKey] - Klucz początkowego sortowania.
 * @param {string[]} [options.filterKeys] - Klucze do filtrowania (np. ["name", "address.city"]).
 * @param {boolean} [options.debug=false] - Czy włączyć logi debugujące.
 * @returns {{
 *  sortedAndFilteredData: Array,
 *  sortConfig: { key: string, direction: 'ascending' | 'descending' },
 *  filterText: string,
 *  setFilterText: Function,
 *  handleSort: Function
 * }}
 */
export const useTableData = (
  initialData = [],
  { initialSortKey = null, filterKeys = [], debug = false } = {}
) => {
  const [sortConfig, setSortConfig] = useState({ key: initialSortKey, direction: 'ascending' });
  const [filterText, setFilterText] = useState('');

  const log = (...args) => {
    if (debug) console.log('📊 useTableData:', ...args);
  };

  /**
   * 🔽 Sortowanie danych
   */
  const sortedData = useMemo(() => {
    const sortableData = Array.isArray(initialData) ? [...initialData] : [];
    const { key, direction } = sortConfig;

    if (!key) return sortableData;

    const isAscending = direction === 'ascending';
    const sorted = sortableData.sort((a, b) => {
      const valA = getNestedValue(a, key);
      const valB = getNestedValue(b, key);

      const strA = typeof valA === 'string' ? valA.toLowerCase() : valA;
      const strB = typeof valB === 'string' ? valB.toLowerCase() : valB;

      if (strA < strB) return isAscending ? -1 : 1;
      if (strA > strB) return isAscending ? 1 : -1;
      return 0;
    });

    log('Sorted', { key, direction, count: sorted.length });
    return sorted;
  }, [initialData, sortConfig]);

  /**
   * 🔁 Zmiana kierunku sortowania
   */
  const handleSort = useCallback(
    (key) => {
      setSortConfig((prev) => ({
        key,
        direction:
          prev.key === key && prev.direction === 'ascending'
            ? 'descending'
            : 'ascending',
      }));
    },
    []
  );

  /**
   * 🔍 Filtrowanie danych
   */
  const sortedAndFilteredData = useMemo(() => {
    if (!Array.isArray(sortedData)) return [];
    if (!filterText) return sortedData;

    const lowerFilter = filterText.toLowerCase();

    const filtered = sortedData.filter((item) =>
      filterKeys.some((key) => {
        const value = getNestedValue(item, key);
        return (
          value &&
          String(value).toLowerCase().includes(lowerFilter)
        );
      })
    );

    log('Filtered', { filterText, resultCount: filtered.length });
    return filtered;
  }, [sortedData, filterText, filterKeys]);

  log('Final result', {
    items: sortedAndFilteredData.length,
    sortConfig,
    filterText,
  });

  return {
    sortedAndFilteredData,
    sortConfig,
    filterText,
    setFilterText,
    handleSort,
  };
};
