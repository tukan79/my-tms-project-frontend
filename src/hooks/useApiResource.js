import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

export const useApiResource = (resourceUrl, resourceName = 'resource') => {
  const [data, setData] = useState(null); // Zmiana na null, aby odróżnić stan początkowy od pustej tablicy
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use a ref to hold the latest setData function to avoid stale closures in callbacks.
  const setDataRef = useRef(setData);
  useEffect(() => {
    setDataRef.current = setData;
  }, [setData]);


  // Używamy useRef do przechowywania stabilnych funkcji
  const resourceUrlRef = useRef(resourceUrl);
  const resourceNameRef = useRef(resourceName);

  // Aktualizujemy refy gdy się zmieniają
  useEffect(() => {
    resourceUrlRef.current = resourceUrl;
    resourceNameRef.current = resourceName;
  }, [resourceUrl, resourceName]);

  // POPRAWIONE: fetchData bez setData w zależnościach
  const fetchData = useCallback(async () => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;
    
    if (!currentUrl) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(currentUrl);
      setDataRef.current(Array.isArray(response.data) ? response.data : []); // Zapewnij, że to zawsze tablica
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || `Failed to fetch ${currentName}.`;
      setError(errorMessage);
      setDataRef.current([]); // W przypadku błędu, ustaw pustą tablicę
    } finally {
      setIsLoading(false);
    }
  }, []); // ⚠️ PUSTE ZALEŻNOŚCI - używamy refów

  // POPRAWIONE: useEffect tylko z resourceUrl
  useEffect(() => {
    if (resourceUrl) {
      fetchData();
    } else {
      setDataRef.current([]); // Jeśli nie ma URL, ustaw pustą tablicę
    }
  }, [resourceUrl]); // ⚠️ TYLKO resourceUrl - fetchData jest stabilne

  // POPRAWIONE: createResource ze stabilnymi zależnościami
  const createResource = useCallback(async (resourceData, optimisticUpdate) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;
    
    let tempId = null;
    if (optimisticUpdate) {
      tempId = `temp-${Date.now()}`;
      const optimisticData = optimisticUpdate(resourceData, tempId);
      setDataRef.current(prevData => [...prevData, optimisticData]);
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(currentUrl, resourceData);
      if (optimisticUpdate) {
        setDataRef.current(prevData => 
          prevData.map(item => (item.id === tempId ? response.data : item))
        );
      } else {
        setDataRef.current(prevData => [...prevData, response.data]);
      }
      return response.data;
    } catch (err) {
      if (optimisticUpdate) {
        setDataRef.current(prevData => prevData.filter(item => item.id !== tempId));
      }
      const errorMessage = err.response?.data?.error || `Failed to create ${currentName}.`;
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // ⚠️ PUSTE ZALEŻNOŚCI

  // POPRAWIONE: deleteResource ze stabilnymi zależnościami
  const deleteResource = useCallback(async (resourceId) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;
    
    let deletedItem = null;
    let originalIndex = -1;

    setDataRef.current(currentData => {
      originalIndex = currentData.findIndex(item => item.id === resourceId);
      if (originalIndex === -1) return currentData;
      deletedItem = currentData[originalIndex];
      return currentData.filter(item => item.id !== resourceId);
    });

    if (originalIndex === -1) return;

    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`${currentUrl}/${resourceId}`);
    } catch (err) {
      setDataRef.current(currentData => {
        const newData = [...currentData];
        newData.splice(originalIndex, 0, deletedItem);
        return newData;
      });
      const errorMessage = err.response?.data?.error || `Failed to delete ${currentName}.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []); // ⚠️ PUSTE ZALEŻNOŚCI

  // POPRAWIONE: updateResource ze stabilnymi zależnościami
  const updateResource = useCallback(async (resourceId, resourceData) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;
    
    let originalData = null;
    setDataRef.current(currentData => {
      originalData = [...currentData];
      return currentData.map(item =>
        item.id === resourceId ? { ...item, ...resourceData } : item
      );
    });

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put(`${currentUrl}/${resourceId}`, resourceData);
      setDataRef.current(prevData =>
        prevData.map(item => (item.id === resourceId ? response.data : item))
      );
      return response.data;
    } catch (err) {
      if (originalData) {
        setDataRef.current(originalData);
      }
      const errorMessage = err.response?.data?.error || `Failed to update ${currentName}.`;
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // ⚠️ PUSTE ZALEŻNOŚCI

  const bulkCreateResource = useCallback(async (payload) => {
    const currentUrl = resourceUrlRef.current;
    const currentName = resourceNameRef.current;

    setIsLoading(true);
    setError(null);
    try {
      // The API for bulk creation might be different, e.g., a specific endpoint
      const response = await api.post(`${currentUrl}/bulk`, payload);
      // After a bulk operation, it's safest to just refetch all data
      fetchData();
      return { success: true, message: response.data.message || `${currentName} created successfully.` };
    } catch (err) {
      const errorMessage = err.response?.data?.error || `Failed to bulk create ${currentName}.`;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []); // ⚠️ PUSTE ZALEŻNOŚCI

  // POPRAWIONE: setData jako stabilna funkcja
  const stableSetData = useCallback((newData) => {
    setData(newData);
  }, []);

  return { 
    data, 
    isLoading, 
    error, 
    fetchData, 
    createResource, 
    updateResource, 
    deleteResource, 
    bulkCreate: bulkCreateResource,
    setData: stableSetData 
  };
};
// ostatnia zmiana (30.05.2024, 13:14:12)