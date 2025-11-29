// src/components/forms/AddUserForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import FormActions from './shared/FormActions.jsx';
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
    password: '',
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
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save user.';
      showToast(message, 'error');
      throw new Error(message);
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

  const fields = [
    {
      component: TextField,
      props: {
        label: 'First Name',
        name: 'first_name',
        value: formData.first_name,
        onChange: handleChange,
        error: errors.first_name,
        required: true,
      },
    },
    {
      component: TextField,
      props: {
        label: 'Last Name',
        name: 'last_name',
        value: formData.last_name,
        onChange: handleChange,
        error: errors.last_name,
        required: true,
      },
    },
    {
      component: TextField,
      props: {
        label: 'Email',
        name: 'email',
        type: 'email',
        value: formData.email,
        onChange: handleChange,
        error: errors.email,
        required: true,
      },
    },
    {
      component: SelectField,
      props: {
        label: 'Role',
        name: 'role',
        value: formData.role,
        onChange: handleChange,
        error: errors.role,
        required: true,
        options: roleOptions,
      },
    },
    {
      component: TextField,
      props: {
        label: isEditMode ? 'New Password (optional)' : 'Password',
        name: 'password',
        type: 'password',
        value: formData.password,
        onChange: handleChange,
        error: errors.password,
        required: !isEditMode,
      },
    },
  ];

  const submitLabel = useMemo(() => {
    if (loading) return 'Saving...';
    return isEditMode ? 'Save Changes' : 'Add User';
  }, [isEditMode, loading]);

  return (
    <div className="card modal-center">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit User' : 'Add New User'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="btn-icon"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form" noValidate>
        {fields.map(({ component: Component, props: fieldProps }) => (
          <Component key={fieldProps.name} {...fieldProps} />
        ))}

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
