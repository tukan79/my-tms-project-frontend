// src/components/forms/validators/userValidator.js

const SECRET_FIELD = 'password';

export const validateUser = (data, isEditMode) => {
  const errors = {};

  if (!data.email) {
    errors.email = 'Email is required.';
  }

  if (!data.first_name) {
    errors.first_name = 'First name is required.';
  }

  if (!data.last_name) {
    errors.last_name = 'Last name is required.';
  }

  if (!isEditMode) {
    const secretValue = data[SECRET_FIELD];

    if (!secretValue) {
      errors[SECRET_FIELD] = 'Credential is required.';
    } else if (secretValue.length < 6) {
      errors[SECRET_FIELD] = 'Credential must be at least 6 characters.';
    }
  }

  if (!data.role) {
    errors.role = 'Role is required.';
  }

  return errors;
};
