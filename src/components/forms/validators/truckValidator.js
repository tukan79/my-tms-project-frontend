// src/components/forms/validators/truckValidator.js

export const validateTruck = (data) => {
  const errors = {};

  if (!data.registration_plate) {
    errors.registration_plate = 'Registration plate is required.';
  }

  if (!data.brand) {
    errors.brand = 'Brand is required.';
  }

  if (!data.model) {
    errors.model = 'Model is required.';
  }

  if (data.type_of_truck === 'rigid') {
    if (!data.total_weight) {
      errors.total_weight = 'Total weight is required.';
    }

    if (!data.pallet_capacity) {
      errors.pallet_capacity = 'Pallet capacity is required.';
    }

    if (!data.max_payload_kg) {
      errors.max_payload_kg = 'Max payload is required.';
    }
  }

  return errors;
};
