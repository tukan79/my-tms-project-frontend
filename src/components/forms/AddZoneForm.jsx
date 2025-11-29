// src/components/forms/AddZoneForm.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { useToast } from '@/contexts/ToastContext.jsx';
import { useForm } from '@/hooks/useForm.js';

import { validateZone } from './validators/zoneValidator.js';
import { createZone, updateZone } from './services/zoneService.js';

import TextField from './fields/TextField.jsx';
import FormActions from './shared/FormActions.jsx';
import FormHeader from './shared/FormHeader.jsx';

const initialFormData = {
  zone_name: '',
  postcode_patterns: '',
  is_home_zone: false,
};

const normalizeEditData = (itemToEdit) => {
  if (!itemToEdit) return null;
  return {
    zone_name: itemToEdit.zone_name ?? '',
    postcode_patterns: itemToEdit.postcode_patterns ?? '',
    is_home_zone: Boolean(itemToEdit.is_home_zone),
  };
};

const AddZoneForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const normalizedItem = useMemo(
    () => normalizeEditData(itemToEdit),
    [itemToEdit]
  );

  const performSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await updateZone(itemToEdit.id, formData);
      } else {
        await createZone(formData);
      }

      showToast(
        `Zone ${isEditMode ? 'updated' : 'created'} successfully.`,
        'success'
      );
      onSuccess();
    } catch (error) {
      const message =
        error.response?.data?.error || 'Failed to save zone.';
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
    validate: validateZone,
    onSubmit: performSubmit,
    itemToEdit: normalizedItem,
  });

  const submitLabel = useMemo(() => {
    if (loading) return 'Saving...';
    return isEditMode ? 'Save Changes' : 'Add Zone';
  }, [isEditMode, loading]);

  return (
    <div className="card modal-center">
      <FormHeader
        title={isEditMode ? 'Edit Zone' : 'Add New Zone'}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="form" noValidate>
        <TextField
          label="Zone Name"
          name="zone_name"
          value={formData.zone_name}
          onChange={handleChange}
          error={errors.zone_name}
          required
        />

        <TextField
          label="Postcode Patterns"
          name="postcode_patterns"
          value={formData.postcode_patterns}
          onChange={handleChange}
          error={errors.postcode_patterns}
          required
        />

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            id="is_home_zone"
            type="checkbox"
            name="is_home_zone"
            checked={formData.is_home_zone}
            onChange={handleChange}
          />
          <label htmlFor="is_home_zone" style={{ marginBottom: 0 }}>
            Home Zone
          </label>
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

AddZoneForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddZoneForm.defaultProps = {
  itemToEdit: null,
};

export default AddZoneForm;
