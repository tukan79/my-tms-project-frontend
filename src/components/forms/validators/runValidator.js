// src/components/forms/validators/runValidator.js

export const validateRun = (data) => {
  const errors = {};

  if (!data.run_date) {
    errors.run_date = 'Run date is required.';
  }

  if (!data.driver_id) {
    errors.driver_id = 'Driver is required.';
  }

  if (!data.truck_id) {
    errors.truck_id = 'Truck is required.';
  }

  return errors;
};
