// src/components/forms/validators/driverValidator.js

export const validateDriver = (data) => {
  const errors = {};

  if (!data.first_name) {
    errors.first_name = 'First name is required.';
  }

  if (!data.last_name) {
    errors.last_name = 'Last name is required.';
  }

  return errors;
};
