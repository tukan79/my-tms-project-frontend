// src/components/forms/AddRunForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { useToast } from '@/contexts/ToastContext.jsx';
import { useForm } from '@/hooks/useForm.js';

import { validateRun } from './validators/runValidator.js';
import { createRun, updateRun } from './services/runService.js';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import FormActions from './shared/FormActions.jsx';
import FormHeader from './shared/FormHeader.jsx';

const initialFormData = {
  run_date: new Date().toISOString().split('T')[0],
  type: 'delivery',
  driver_id: '',
  truck_id: '',
  trailer_id: '',
};

/** Normalize data for editing */
const normalizeEditData = (item) => {
  if (!item) return null;

  return {
    ...item,
    run_date: item.run_date
      ? new Date(item.run_date).toISOString().split('T')[0]
      : initialFormData.run_date,
    driver_id: item.driver_id ?? '',
    truck_id: item.truck_id ?? '',
    trailer_id: item.trailer_id ?? '',
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

  /** Submit handler */
  const performSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await updateRun(itemToEdit.id, formData);
      } else {
        await createRun(formData);
      }

      showToast(
        isEditMode ? 'Run updated successfully.' : 'Run created successfully.',
        'success'
      );
      onSuccess();
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to save run.';
      showToast(message, 'error');
      throw new Error(message);
    }
  };

  /** Form hook */
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

  /** Build dropdown configs */
  const selectFields = useMemo(
    () => [
      {
        label: 'Run Type',
        name: 'type',
        required: true,
        value: formData.type,
        onChange: handleChange,
        options: [
          { value: 'delivery', label: 'Delivery' },
          { value: 'collection', label: 'Collection' },
          { value: 'transfer', label: 'Transfer' },
        ],
      },
      {
        label: 'Driver',
        name: 'driver_id',
        required: true,
        value: formData.driver_id,
        error: errors.driver_id,
        onChange: handleChange,
        options: drivers.map((d) => ({
          value: d.id,
          label: `${d.first_name} ${d.last_name}`,
        })),
      },
      {
        label: 'Truck',
        name: 'truck_id',
        required: true,
        value: formData.truck_id,
        error: errors.truck_id,
        onChange: handleChange,
        options: trucks.map((t) => ({
          value: t.id,
          label: t.registration_plate,
        })),
      },
      {
        label: 'Trailer',
        name: 'trailer_id',
        required: false,
        value: formData.trailer_id,
        onChange: handleChange,
        options: trailers.map((t) => ({
          value: t.id,
          label: t.registration_plate,
        })),
      },
    ],
    [
      drivers,
      trucks,
      trailers,
      formData.type,
      formData.driver_id,
      formData.truck_id,
      formData.trailer_id,
      handleChange,
      errors.driver_id,
      errors.truck_id,
    ]
  );

  const submitLabel = loading
    ? 'Saving…'
    : isEditMode
    ? 'Save Changes'
    : 'Add Run';

  return (
    <div className="card modal-center form-card">
      <FormHeader
        title={isEditMode ? 'Edit Run' : 'Add New Run'}
        onCancel={onCancel}
      />

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

        {/* Two-column layout */}
        <div className="form-grid-2col">
          {selectFields.map((item) => (
            <SelectField key={item.name} {...item} />
          ))}
        </div>

        <FormActions
          onCancel={onCancel}
          loading={loading}
          submitLabel={submitLabel}
        />
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
