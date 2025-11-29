// src/components/forms/validators/trailerValidator.js

export const validateTrailer = (data) => {
  const errors = {};

  if (!data.registration_plate) {
    errors.registration_plate = 'Trailer code is required.';
  }

  if (!data.description) {
    errors.description = 'Description is required.';
  }

  if (!data.brand) {
    errors.brand = 'Brand is required.';
  }

  if (!data.max_payload_kg) {
    errors.max_payload_kg = 'Max payload is required.';
  }

  if (!data.max_spaces) {
    errors.max_spaces = 'Max pallet spaces is required.';
  }

  return errors;
};
