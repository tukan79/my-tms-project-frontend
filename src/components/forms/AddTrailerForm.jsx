// src/components/forms/AddTrailerForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import { validateTrailer } from './validators/trailerValidator.js';
import {
  createTrailer,
  updateTrailer,
} from './services/trailerService.js';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';

const initialFormData = {
  registration_plate: '',
  description: '',
  category: 'Own',
  brand: '',
  max_payload_kg: '',
  max_spaces: '',
  length_m: '',
  width_m: '',
  height_m: '',
  weight_kg: '',
  status: 'active',
};

const normalizeEditData = (item) => {
  if (!item) {
    return null;
  }
  return { ...item };
};

const normalizeSubmitData = (data) => ({
  ...data,
  max_payload_kg: data.max_payload_kg ? Number(data.max_payload_kg) : null,
  max_spaces: data.max_spaces ? Number(data.max_spaces) : null,
  length_m: data.length_m ? Number(data.length_m) : null,
  width_m: data.width_m ? Number(data.width_m) : null,
  height_m: data.height_m ? Number(data.height_m) : null,
  weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
});

const AddTrailerForm = ({
  onSuccess,
  onCancel,
  itemToEdit,
}) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const normalizedItem = useMemo(
    () => normalizeEditData(itemToEdit),
    [itemToEdit]
  );

  const performSubmit = async (formData) => {
    try {
      const payload = normalizeSubmitData(formData);

      if (isEditMode) {
        await updateTrailer(itemToEdit.id, payload);
      } else {
        await createTrailer(payload);
      }

      const successMessage = isEditMode
        ? 'Trailer updated successfully!'
        : 'Trailer added successfully!';

      showToast(successMessage, 'success');
      onSuccess();
    } catch (error) {
      const message =
        error.response?.data?.error ||
        'An error occurred while saving the trailer.';

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
    validate: validateTrailer,
    onSubmit: performSubmit,
    itemToEdit: normalizedItem,
  });

  const getSubmitLabel = () => {
    if (loading) {
      return 'Saving...';
    }

    if (isEditMode) {
      return 'Save Changes';
    }

    return 'Add Trailer';
  };

  return (
    <div className="card modal-center">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Trailer' : 'Add New Trailer'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="btn-icon"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>

      {errors.form && (
        <div className="error-message">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="form-grid">
          <div className="form-column">
            <TextField
              label="Trailer Code"
              name="registration_plate"
              value={formData.registration_plate}
              onChange={handleChange}
              error={errors.registration_plate}
              required
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              required
            />

            <TextField
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              error={errors.brand}
              required
            />

            <SelectField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={[
                { value: 'Own', label: 'Own' },
                { value: 'Subcontractor', label: 'Subcontractor' },
              ]}
            />

            <SelectField
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="form-column">
            <TextField
              label="Max Payload (kg)"
              name="max_payload_kg"
              type="number"
              value={formData.max_payload_kg}
              onChange={handleChange}
              error={errors.max_payload_kg}
              required
            />

            <TextField
              label="Max Pallet Spaces"
              name="max_spaces"
              type="number"
              value={formData.max_spaces}
              onChange={handleChange}
              error={errors.max_spaces}
              required
            />

            <TextField
              label="Length (m)"
              name="length_m"
              type="number"
              value={formData.length_m}
              onChange={handleChange}
            />

            <TextField
              label="Width (m)"
              name="width_m"
              type="number"
              value={formData.width_m}
              onChange={handleChange}
            />

            <TextField
              label="Height (m)"
              name="height_m"
              type="number"
              value={formData.height_m}
              onChange={handleChange}
            />

            <TextField
              label="Weight (kg)"
              name="weight_kg"
              type="number"
              value={formData.weight_kg}
              onChange={handleChange}
            />
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
            {getSubmitLabel()}
          </button>
        </div>
      </form>
    </div>
  );
};

AddTrailerForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddTrailerForm.defaultProps = {
  itemToEdit: null,
};

export default AddTrailerForm;
