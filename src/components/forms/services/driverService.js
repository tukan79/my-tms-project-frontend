// src/components/forms/services/driverService.js

import api from '@/services/api.js';

export const createDriver = (payload) => {
  return api.post('/api/drivers', payload);
};

export const updateDriver = (id, payload) => {
  return api.put(`/api/drivers/${id}`, payload);
};
