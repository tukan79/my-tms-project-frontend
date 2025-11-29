// src/components/forms/services/runService.js

import api from '@/services/api.js';

export const createRun = (payload) => {
  return api.post('/api/runs', payload);
};

export const updateRun = (id, payload) => {
  return api.put(`/api/runs/${id}`, payload);
};
