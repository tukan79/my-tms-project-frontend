// src/components/forms/services/userService.js

import api from '@/services/api.js';

export const createUser = (payload) => {
  return api.post('/api/users', payload);
};

export const updateUser = (id, payload) => {
  return api.put(`/api/users/${id}`, payload);
};
