// src/components/forms/validators/zoneValidator.js

export const validateZone = (data) => {
  const errors = {};

  if (!data.zone_name) {
    errors.zone_name = 'Zone name is required.';
  }

  if (!data.postcode_patterns) {
    errors.postcode_patterns = 'Postcode patterns are required.';
  }

  return errors;
};
