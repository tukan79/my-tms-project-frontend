// src/components/forms/AddDriverForm.jsx
import React from 'react';
import PropTypes from 'prop-types';

import { X } from 'lucide-react';
import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import TextField from './fields/TextField.jsx';
import { validateDriver } from './validators/driverValidator.js';
import { createDriver, updateDriver } from './services/driverService.js';

const initialFormData = {
  first_name: '',
  last_name: '',
  phone_number: '',
  license_number: '',
  cpc_number: '',
  login_code: '',
  is_active: true,
};

const AddDriverForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const performSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await updateDriver(itemToEdit.id, formData);
      } else {
        await createDriver(formData);
      }

      showToast(
        `Driver ${isEditMode ? 'updated' : 'added'} successfully.`,
        'success'
      );
      onSuccess();
    } catch (error) {
      const message =
        error.response?.data?.error || 'Failed to save driver.';
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
    validate: validateDriver,
    onSubmit: performSubmit,
    itemToEdit,
  });

  return (
    <div className="card">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Driver' : 'Add New Driver'}</h2>
        <button type="button" onClick={onCancel} className="btn-icon">
          <X size={20} />
        </button>
      </div>

      {errors.form && <div className="error-message">{errors.form}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-column">
            <h4>Driver Details</h4>

            <TextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
            />

            <TextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
            />

            <TextField
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
            />

            <TextField
              label="License Number"
              name="license_number"
              value={formData.license_number}
              onChange={handleChange}
            />

            <TextField
              label="CPC Number"
              name="cpc_number"
              value={formData.cpc_number}
              onChange={handleChange}
            />

            <TextField
              label="Login Code"
              name="login_code"
              value={formData.login_code}
              onChange={handleChange}
            />

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={Boolean(formData.is_active)}
                onChange={handleChange}
              />
              <label htmlFor="is_active" style={{ margin: 0, fontWeight: 600 }}>
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Driver'}
          </button>
        </div>
      </form>
    </div>
  );
};

AddDriverForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddDriverForm.defaultProps = {
  itemToEdit: null,
};

export default AddDriverForm;
