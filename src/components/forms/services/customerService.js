// src/components/forms/services/customerService.js
import api from '@/services/api.js';

export const createCustomer = (data) => {
  return api.post('/api/customers', data);
};

export const updateCustomer = (id, data) => {
  return api.put(`/api/customers/${id}`, data);
};
