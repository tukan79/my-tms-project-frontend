// frontend/src/hooks/useTableData.js
import { useState, useMemo, useCallback } from 'react';

// Funkcja pomocnicza do pobierania wartości z zagnieżdżonych obiektów
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const useTableData = (initialData = [], { initialSortKey, filterKeys }) => {
  console.log('🔍 useTableData STEP 1 - Input:', {
    initialData,
    initialDataIsArray: Array.isArray(initialData),
    // Poprawka: Bezpieczne sprawdzanie długości
    initialDataLength: Array.isArray(initialData) ? initialData.length : 'undefined'
  });

  const [sortConfig, setSortConfig] = useState({ key: initialSortKey, direction: 'ascending' });
  const [filterText, setFilterText] = useState('');

  const sortedData = useMemo(() => {
    console.log('🔍 useTableData STEP 2 - Creating sortedData');
    // Zabezpieczenie: Gwarantujemy, że dane do sortowania są zawsze tablicą.
    const sortableData = Array.isArray(initialData) ? [...initialData] : [];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const valA = getNestedValue(a, sortConfig.key);
        const valB = getNestedValue(b, sortConfig.key);
        
        // Ulepszenie: sortowanie stringów bez uwzględniania wielkości liter
        const strA = typeof valA === 'string' ? valA.toLowerCase() : valA;
        const strB = typeof valB === 'string' ? valB.toLowerCase() : valB;

        if (strA < strB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (strA > strB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    console.log('🔍 useTableData STEP 3 - sortedData result:', sortableData.length);
    return sortableData;
  }, [initialData, sortConfig]);

  const handleSort = useCallback((key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const sortedAndFilteredData = useMemo(() => {
    console.log('🔍 useTableData STEP 4 - Creating sortedAndFilteredData');
    // Dodatkowe zabezpieczenie: Upewniamy się, że `sortedData` jest tablicą przed filtrowaniem.
    const safeSortedData = Array.isArray(sortedData) ? sortedData : [];

    if (!filterText) {
      console.log('🔍 useTableData STEP 5 - No filter, returning:', safeSortedData.length);
      return safeSortedData;
    }

    const result = safeSortedData.filter(item =>
      (filterKeys || []).some(key => { // Zabezpieczenie: Użyj pustej tablicy, jeśli filterKeys jest undefined.
        const value = getNestedValue(item, key) ?? ''; // Zabezpieczenie przed null/undefined
        return value && String(value).toLowerCase().includes(filterText.toLowerCase());
      })
    );

    console.log('🔍 useTableData STEP 6 - Filtered result:', result.length);
    return result;
  }, [sortedData, filterText, filterKeys]);

  console.log('🔍 useTableData STEP 7 - Final result:', {
    sortedAndFilteredData,
    isArray: Array.isArray(sortedAndFilteredData),
    length: sortedAndFilteredData?.length
  });

  return { sortedAndFilteredData, sortConfig, filterText, setFilterText, handleSort };
};
// ostatnia zmiana (30.05.2024, 13:14:12)
