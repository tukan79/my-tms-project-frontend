// src/components/forms/AddRunForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

import { useToast } from '@/contexts/ToastContext.jsx';
import { useForm } from '@/hooks/useForm.js';

import { validateRun } from './validators/runValidator.js';
import { createRun, updateRun } from './services/runService.js';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';

const initialFormData = {
  run_date: new Date().toISOString().split('T')[0],
  type: 'delivery',
  driver_id: '',
  truck_id: '',
  trailer_id: '',
};

const normalizeEditData = (itemToEdit) => {
  if (!itemToEdit) {
    return null;
  }

  return {
    ...itemToEdit,
    run_date: itemToEdit.run_date
      ? new Date(itemToEdit.run_date).toISOString().split('T')[0]
      : initialFormData.run_date,
    driver_id: itemToEdit.driver_id ?? '',
    truck_id: itemToEdit.truck_id ?? '',
    trailer_id: itemToEdit.trailer_id ?? '',
  };
};

const AddRunForm = ({
  onSuccess,
  onCancel,
  itemToEdit,
  drivers,
  trucks,
  trailers,
}) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const normalizedItem = useMemo(
    () => normalizeEditData(itemToEdit),
    [itemToEdit]
  );

  const performSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await updateRun(itemToEdit.id, formData);
      } else {
        await createRun(formData);
      }

      const successMessage = isEditMode
        ? 'Run updated successfully.'
        : 'Run created successfully.';

      showToast(successMessage, 'success');
      onSuccess();
    } catch (error) {
      const message =
        error.response?.data?.error || 'Failed to save run.';
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
    validate: validateRun,
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

    return 'Add Run';
  };

  return (
    <div className="card modal-center">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Run' : 'Add New Run'}</h2>
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
          label="Run Date"
          type="date"
          name="run_date"
          value={formData.run_date}
          onChange={handleChange}
          error={errors.run_date}
          required
        />

        <SelectField
          label="Driver"
          name="driver_id"
          value={formData.driver_id}
          onChange={handleChange}
          error={errors.driver_id}
          required
          options={drivers.map((driver) => ({
            value: driver.id,
            label: `${driver.first_name} ${driver.last_name}`,
          }))}
        />

        <SelectField
          label="Truck"
          name="truck_id"
          value={formData.truck_id}
          onChange={handleChange}
          error={errors.truck_id}
          required
          options={trucks.map((truck) => ({
            value: truck.id,
            label: truck.registration_plate,
          }))}
        />

        <SelectField
          label="Trailer"
          name="trailer_id"
          value={formData.trailer_id}
          onChange={handleChange}
          options={trailers.map((trailer) => ({
            value: trailer.id,
            label: trailer.registration_plate,
          }))}
        />

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

AddRunForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
  drivers: PropTypes.arrayOf(PropTypes.object),
  trucks: PropTypes.arrayOf(PropTypes.object),
  trailers: PropTypes.arrayOf(PropTypes.object),
};

AddRunForm.defaultProps = {
  itemToEdit: null,
  drivers: [],
  trucks: [],
  trailers: [],
};

export default AddRunForm;
