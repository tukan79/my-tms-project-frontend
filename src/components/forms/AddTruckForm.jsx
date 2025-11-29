// src/components/forms/AddTruckForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import { validateTruck } from './validators/truckValidator.js';
import {
  createTruck,
  updateTruck,
} from './services/truckService.js';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';

const initialFormData = {
  registration_plate: '',
  brand: '',
  model: '',
  vin: '',
  production_year: '',
  type_of_truck: 'tractor',
  total_weight: '',
  pallet_capacity: '',
  max_payload_kg: '',
  is_active: true,
};

const normalizeEditData = (item) => {
  if (!item) {
    return null;
  }

  return { ...item };
};

const normalizeSubmitData = (data) => ({
  ...data,
  production_year: data.production_year ? Number(data.production_year) : null,
  total_weight:
    data.type_of_truck === 'rigid' && data.total_weight
      ? Number(data.total_weight)
      : null,
  pallet_capacity:
    data.type_of_truck === 'rigid' && data.pallet_capacity
      ? Number(data.pallet_capacity)
      : null,
  max_payload_kg:
    data.type_of_truck === 'rigid' && data.max_payload_kg
      ? Number(data.max_payload_kg)
      : null,
});

const AddTruckForm = ({ onSuccess, onCancel, itemToEdit }) => {
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
        await updateTruck(itemToEdit.id, payload);
      } else {
        await createTruck(payload);
      }

      const successMessage = isEditMode
        ? 'Vehicle updated successfully!'
        : 'Vehicle added successfully!';

      showToast(successMessage, 'success');
      onSuccess();
    } catch (error) {
      const message =
        error.response?.data?.error ||
        'An error occurred while saving the vehicle.';

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
    validate: validateTruck,
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

    return 'Add Vehicle';
  };

  const shouldShowRigidFields =
    formData.type_of_truck === 'rigid';

  return (
    <div className="card modal-center">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
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
        <TextField
          label="Brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          error={errors.brand}
          required
        />

        <TextField
          label="Model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          error={errors.model}
          required
        />

        <TextField
          label="Registration Plate"
          name="registration_plate"
          value={formData.registration_plate}
          onChange={handleChange}
          error={errors.registration_plate}
          required
        />

        <TextField
          label="VIN"
          name="vin"
          value={formData.vin}
          onChange={handleChange}
        />

        <TextField
          label="Production Year"
          name="production_year"
          type="number"
          value={formData.production_year}
          onChange={handleChange}
        />

        <SelectField
          label="Vehicle Type"
          name="type_of_truck"
          value={formData.type_of_truck}
          onChange={handleChange}
          required
          options={[
            { value: 'tractor', label: 'Tractor Unit' },
            { value: 'rigid', label: 'Rigid Truck' },
          ]}
        />

        {shouldShowRigidFields && (
          <>
            <TextField
              label="Total Weight (kg)"
              name="total_weight"
              type="number"
              value={formData.total_weight}
              onChange={handleChange}
              error={errors.total_weight}
              required
            />

            <TextField
              label="Pallet Capacity"
              name="pallet_capacity"
              type="number"
              value={formData.pallet_capacity}
              onChange={handleChange}
              error={errors.pallet_capacity}
              required
            />

            <TextField
              label="Max Payload (kg)"
              name="max_payload_kg"
              type="number"
              value={formData.max_payload_kg}
              onChange={handleChange}
              error={errors.max_payload_kg}
              required
            />
          </>
        )}

        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={Boolean(formData.is_active)}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>
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

AddTruckForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddTruckForm.defaultProps = {
  itemToEdit: null,
};

export default AddTruckForm;
