// src/components/forms/services/zoneService.js
import api from '@/services/api.js';

export const createZone = (payload) => {
  return api.post('/api/zones', payload);
};

export const updateZone = (id, payload) => {
  return api.put(`/api/zones/${id}`, payload);
};
