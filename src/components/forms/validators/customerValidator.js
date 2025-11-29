// src/components/forms/validators/customerValidator.js

export const validateCustomer = (data) => {
  const errors = {};

  if (!data.customer_code || data.customer_code.trim().length === 0) {
    errors.customer_code = 'Customer code is required.';
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Customer name is required.';
  }

  return errors;
};
