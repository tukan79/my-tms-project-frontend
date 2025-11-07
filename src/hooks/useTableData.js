// frontend/src/hooks/useTableData.js
import { useState, useMemo, useCallback } from 'react';

/**
 * Pobiera wartość z zagnieżdżonego obiektu według ścieżki (np. "user.address.city")
 */
const getNestedValue = (obj, path) => {
  if (!path || !obj) return undefined;
  try {
    return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
  } catch {
    return undefined;
  }
};

/**
 * Hook do obsługi sortowania i filtrowania danych tabeli.
 */
export const useTableData = (
  initialData = [],
  { initialSortKey = null, filterKeys = [], debug = false } = {}
) => {
  const [sortConfig, setSortConfig] = useState({
    key: initialSortKey,
    direction: 'ascending',
  });

  const [filterText, setFilterText] = useState('');

  const log = (...args) => {
    if (debug) console.log('📊 useTableData:', ...args);
  };

  /**
   * 🔽 SORTOWANIE
   */
  const sortedData = useMemo(() => {
    const safeData = Array.isArray(initialData) ? [...initialData] : [];
    const { key, direction } = sortConfig;

    if (!key) return safeData;

    const isAscending = direction === 'ascending';
    const sorted = safeData.sort((a, b) => {
      const valA = getNestedValue(a, key);
      const valB = getNestedValue(b, key);

      const normA = typeof valA === 'string' ? valA.toLowerCase() : valA ?? '';
      const normB = typeof valB === 'string' ? valB.toLowerCase() : valB ?? '';

      if (normA < normB) return isAscending ? -1 : 1;
      if (normA > normB) return isAscending ? 1 : -1;
      return 0;
    });

    log('Sorted', { key, direction, count: sorted.length });
    return sorted;
  }, [initialData, sortConfig]);

  /**
   * 🔁 SORTOWANIE - ZMIANA KIERUNKU
   */
  const handleSort = useCallback(
    (key) => {
      setSortConfig((prev) => ({
        key,
        direction:
          prev.key === key && prev.direction === 'ascending' ?
          'descending' :
          'ascending',
      }));
    },
    []
  );

  /**
   * 🔍 FILTROWANIE
   */
  const sortedAndFilteredData = useMemo(() => {
    if (!Array.isArray(sortedData)) return [];
    if (!filterText) return sortedData;

    const lowerFilter = filterText.toLowerCase();

    const filtered = sortedData.filter((item) =>
      Array.isArray(filterKeys) && filterKeys.some((key) => {
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

  // ✅ Gwarantuje, że hook **zawsze zwróci poprawne wartości**, nawet przy błędach
  return {
    sortedAndFilteredData: Array.isArray(sortedAndFilteredData) ? sortedAndFilteredData : [],
    sortConfig: sortConfig || { key: null, direction: 'ascending' },
    filterText: typeof filterText === 'string' ? filterText : '',
    setFilterText: typeof setFilterText === 'function' ? setFilterText : () => {},
    handleSort: typeof handleSort === 'function' ? handleSort : () => {},
  };
};
