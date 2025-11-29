// src/components/forms/services/truckService.js

import api from '@/services/api.js';

export const createTruck = (payload) => {
  return api.post('/api/trucks', payload);
};

export const updateTruck = (id, payload) => {
  return api.put(`/api/trucks/${id}`, payload);
};
