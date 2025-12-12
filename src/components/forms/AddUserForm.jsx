// src/components/forms/AddUserForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import FormActions from './shared/FormActions.jsx';
import FormHeader from './shared/FormHeader.jsx';

import { validateUser } from './validators/userValidator.js';
import { createUser, updateUser } from './services/userService.js';

const initialFormData = {
  first_name: '',
  last_name: '',
  email: '',
  role: 'dispatcher',
  password: '',
};

const normalizeEditData = (itemToEdit) => {
  if (!itemToEdit) return null;

  return {
    ...itemToEdit,
    password: '', // password cannot be shown — must be reset manually
  };
};

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'dispatcher', label: 'Dispatcher' },
];

const AddUserForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const normalizedItem = useMemo(
    () => normalizeEditData(itemToEdit),
    [itemToEdit]
  );

  const performSubmit = async (formData) => {
    const payload = { ...formData };

    // Editing → password optional
    if (isEditMode && !payload.password) {
      delete payload.password;
    }

    try {
      if (isEditMode) {
        await updateUser(itemToEdit.id, payload);
      } else {
        await createUser(payload);
      }

      showToast(
        `User ${isEditMode ? 'updated' : 'created'} successfully.`,
        'success'
      );

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save user.';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
  } = useForm({
    initialState: initialFormData,
    validate: (data) => validateUser(data, isEditMode),
    onSubmit: performSubmit,
    itemToEdit: normalizedItem,
  });

  const submitLabel = loading
    ? 'Saving...'
    : isEditMode
    ? 'Save Changes'
    : 'Add User';

  return (
    <div className="card modal-center form-card">

      <FormHeader
        title={isEditMode ? 'Edit User' : 'Add New User'}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="form" noValidate>

        {/* MAIN FORM GRID */}
        <div className="form-grid-2col">

          <TextField
            label="First Name"
            name="first_name"
            required
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
          />

          <TextField
            label="Last Name"
            name="last_name"
            required
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <SelectField
            label="Role"
            name="role"
            required
            value={formData.role}
            onChange={handleChange}
            error={errors.role}
            options={roleOptions}
          />

          <TextField
            label={isEditMode ? 'New Password (optional)' : 'Password'}
            name="password"
            type="password"
            required={!isEditMode}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
        </div>

        {/* ACTIONS */}
        <FormActions
          onCancel={onCancel}
          loading={loading}
          submitLabel={submitLabel}
        />
      </form>
    </div>
  );
};

AddUserForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddUserForm.defaultProps = {
  itemToEdit: null,
};

export default AddUserForm;
