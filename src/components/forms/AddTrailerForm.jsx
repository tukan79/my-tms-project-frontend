// src/components/forms/AddTrailerForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import { validateTrailer } from './validators/trailerValidator.js';
import { createTrailer, updateTrailer } from './services/trailerService.js';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import FormHeader from './shared/FormHeader.jsx';
import FormActions from './shared/FormActions.jsx';

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

/* Normalize edit-mode data */
const normalizeEditData = (item) => {
  if (!item) return null;
  return {
    ...item,
    max_payload_kg: item.max_payload_kg ?? '',
    max_spaces: item.max_spaces ?? '',
    length_m: item.length_m ?? '',
    width_m: item.width_m ?? '',
    height_m: item.height_m ?? '',
    weight_kg: item.weight_kg ?? '',
  };
};

/* Convert form fields to correct numeric types before send */
const normalizeSubmitData = (data) => ({
  ...data,
  max_payload_kg: data.max_payload_kg ? Number(data.max_payload_kg) : null,
  max_spaces: data.max_spaces ? Number(data.max_spaces) : null,
  length_m: data.length_m ? Number(data.length_m) : null,
  width_m: data.width_m ? Number(data.width_m) : null,
  height_m: data.height_m ? Number(data.height_m) : null,
  weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
});

const AddTrailerForm = ({ onSuccess, onCancel, itemToEdit }) => {
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

      showToast(
        isEditMode ? 'Trailer updated successfully!' : 'Trailer added successfully!',
        'success'
      );

      onSuccess();
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        'Failed to save trailer.';

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

  return (
    <div className="card modal-center form-card">
      
      <FormHeader
        title={isEditMode ? 'Edit Trailer' : 'Add New Trailer'}
        onCancel={onCancel}
      />

      {errors.form && (
        <div className="error-message">{errors.form}</div>
      )}

      <form onSubmit={handleSubmit} className="form" noValidate>

        {/* TWO-COLUMN GRID */}
        <div className="form-grid-2col">

          {/* LEFT COLUMN */}
          <div>
            <TextField
              label="Trailer Code"
              name="registration_plate"
              required
              value={formData.registration_plate}
              onChange={handleChange}
              error={errors.registration_plate}
            />

            <TextField
              label="Description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
            />

            <TextField
              label="Brand"
              name="brand"
              required
              value={formData.brand}
              onChange={handleChange}
              error={errors.brand}
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

          {/* RIGHT COLUMN */}
          <div>
            <TextField
              label="Max Payload (kg)"
              type="number"
              required
              name="max_payload_kg"
              value={formData.max_payload_kg}
              onChange={handleChange}
              error={errors.max_payload_kg}
            />

            <TextField
              label="Max Pallet Spaces"
              type="number"
              required
              name="max_spaces"
              value={formData.max_spaces}
              onChange={handleChange}
              error={errors.max_spaces}
            />

            <TextField
              label="Length (m)"
              type="number"
              name="length_m"
              value={formData.length_m}
              onChange={handleChange}
            />

            <TextField
              label="Width (m)"
              type="number"
              name="width_m"
              value={formData.width_m}
              onChange={handleChange}
            />

            <TextField
              label="Height (m)"
              type="number"
              name="height_m"
              value={formData.height_m}
              onChange={handleChange}
            />

            <TextField
              label="Weight (kg)"
              type="number"
              name="weight_kg"
              value={formData.weight_kg}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* FORM BUTTONS */}
        <FormActions
          onCancel={onCancel}
          loading={loading}
          submitLabel={isEditMode ? 'Save Changes' : 'Add Trailer'}
        />
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
