import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const PopOutContext = createContext(null);

export const usePopOut = () => {
  const context = useContext(PopOutContext);
  if (!context) {
    throw new Error('usePopOut must be used within a PopOutProvider');
  }
  return context;
};

export const PopOutProvider = ({ children }) => {
  const [popOutData, setPopOutData] = useState({
    orders: [],
    runs: [],
    assignments: [],
    drivers: [],
    trucks: [],
    trailers: [],
    zones: [],
  });

  // 🔹 Bezpieczne ładowanie danych z sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('popOutData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setPopOutData(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse popOutData from sessionStorage:', error);
      sessionStorage.removeItem('popOutData'); // usuń uszkodzony wpis
    }
  }, []);

  // 🔹 Automatyczne zapisywanie do sessionStorage przy każdej zmianie
  useEffect(() => {
    try {
      sessionStorage.setItem('popOutData', JSON.stringify(popOutData));
    } catch (error) {
      console.error('❌ Failed to save popOutData to sessionStorage:', error);
    }
  }, [popOutData]);

  // 🔹 Funkcja aktualizująca tylko część danych (bez nadpisywania wszystkiego)
  const updatePopOutData = useCallback((updates) => {
    setPopOutData(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // 🔹 Reset danych (np. przy zamknięciu okna lub wylogowaniu)
  const resetPopOutData = useCallback(() => {
    setPopOutData({
      orders: [],
      runs: [],
      assignments: [],
      drivers: [],
      trucks: [],
      trailers: [],
      zones: [],
    });
    sessionStorage.removeItem('popOutData');
  }, []);

  // 🔹 Memoizacja wartości kontekstu
  const contextValue = useMemo(() => ({
    popOutData,
    setPopOutData,
    updatePopOutData,
    resetPopOutData,
  }), [popOutData, updatePopOutData, resetPopOutData]);

  return (
    <PopOutContext.Provider value={contextValue}>
      {children}
    </PopOutContext.Provider>
  );
};

// ostatnia zmiana (04.11.2025, 20:11:00)
