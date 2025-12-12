// src/components/forms/AddTruckForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';

import { validateTruck } from './validators/truckValidator.js';
import { createTruck, updateTruck } from './services/truckService.js';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import FormHeader from './shared/FormHeader.jsx';
import FormActions from './shared/FormActions.jsx';

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
  if (!item) return null;

  return {
    ...item,
    production_year: item.production_year ?? '',
    total_weight: item.total_weight ?? '',
    pallet_capacity: item.pallet_capacity ?? '',
    max_payload_kg: item.max_payload_kg ?? '',
  };
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

      showToast(
        isEditMode ? 'Vehicle updated successfully!' : 'Vehicle added successfully!',
        'success'
      );

      onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Failed to save vehicle.';
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
    validate: validateTruck,
    onSubmit: performSubmit,
    itemToEdit: normalizedItem,
  });

  const submitLabel = loading
    ? 'Saving...'
    : isEditMode
    ? 'Save Changes'
    : 'Add Vehicle';

  const isRigid = formData.type_of_truck === 'rigid';

  return (
    <div className="card modal-center form-card">
      <FormHeader
        title={isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="form" noValidate>

        {/* MAIN INFO — TWO COLUMNS */}
        <h3>Main Information</h3>

        <div className="form-grid-2col">

          {/* Left column */}
          <div>
            <TextField
              label="Brand"
              name="brand"
              required
              value={formData.brand}
              onChange={handleChange}
              error={errors.brand}
            />

            <TextField
              label="Model"
              name="model"
              required
              value={formData.model}
              onChange={handleChange}
              error={errors.model}
            />

            <TextField
              label="Registration Plate"
              name="registration_plate"
              required
              value={formData.registration_plate}
              onChange={handleChange}
              error={errors.registration_plate}
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
          </div>

          {/* Right column */}
          <div>
            <SelectField
              label="Vehicle Type"
              name="type_of_truck"
              required
              value={formData.type_of_truck}
              onChange={handleChange}
              options={[
                { value: 'tractor', label: 'Tractor Unit' },
                { value: 'rigid', label: 'Rigid Truck' },
              ]}
            />

            {/* Toggle Active */}
            <div className="form-group toggle-row">
              <label htmlFor="is_active" className="toggle-label">Active</label>
              <button
                type="button"
                onClick={() =>
                  handleChange({
                    target: {
                      name: 'is_active',
                      value: !formData.is_active,
                      type: 'checkbox',
                      checked: !formData.is_active,
                    },
                  })
                }
                className="toggle-switch"
                style={{
                  background: formData.is_active ? 'var(--primary)' : '#d0d4df',
                }}
              >
                <span
                  className="toggle-knob"
                  style={{
                    left: formData.is_active ? '22px' : '2px',
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* RIGID ONLY SECTION */}
        {isRigid && (
          <>
            <h3>Rigid Truck Details</h3>

            <div className="form-grid-2col">

              <TextField
                label="Total Weight (kg)"
                name="total_weight"
                type="number"
                required
                value={formData.total_weight}
                onChange={handleChange}
                error={errors.total_weight}
              />

              <TextField
                label="Pallet Capacity"
                name="pallet_capacity"
                type="number"
                required
                value={formData.pallet_capacity}
                onChange={handleChange}
                error={errors.pallet_capacity}
              />

              <TextField
                label="Max Payload (kg)"
                name="max_payload_kg"
                type="number"
                required
                value={formData.max_payload_kg}
                onChange={handleChange}
                error={errors.max_payload_kg}
              />
            </div>
          </>
        )}

        <FormActions
          onCancel={onCancel}
          loading={loading}
          submitLabel={submitLabel}
        />
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
