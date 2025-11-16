import { useMemo } from 'react';
import api from '@/services/api';

/**
 * Custom hook to provide a stable instance of the configured Axios API client.
 * This prevents re-creating the API object on every render.
 */
export const useApi = () => {
  // useMemo ensures that the api instance is stable across re-renders.
  return useMemo(() => api, []);
};