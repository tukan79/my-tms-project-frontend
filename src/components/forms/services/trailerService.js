// src/components/forms/services/trailerService.js

import api from '@/services/api.js';

export const createTrailer = (payload) => {
  return api.post('/api/trailers', payload);
};

export const updateTrailer = (id, payload) => {
  return api.put(`/api/trailers/${id}`, payload);
};
