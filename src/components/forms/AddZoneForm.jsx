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
    } catch (err) {
      const message =
        err.response?.data?.error || 'Failed to save zone.';
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

  const submitLabel = loading
    ? 'Saving...'
    : isEditMode
    ? 'Save Changes'
    : 'Add Zone';

  return (
    <div className="card modal-center form-card">

      <FormHeader
        title={isEditMode ? 'Edit Zone' : 'Add New Zone'}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="form" noValidate>

        {/* GRID */}
        <div className="form-grid-2col">

          <TextField
            label="Zone Name"
            name="zone_name"
            required
            value={formData.zone_name}
            onChange={handleChange}
            error={errors.zone_name}
          />

          <TextField
            label="Postcode Patterns"
            name="postcode_patterns"
            required
            placeholder="E.g. AB1%, AB2%, BT%, etc."
            value={formData.postcode_patterns}
            onChange={handleChange}
            error={errors.postcode_patterns}
          />

          {/* TOGGLE - Modern Switch */}
          <div className="form-group" style={{ marginTop: '0.25rem' }}>
            <label style={{ fontWeight: 600, display: 'block' }}>
              Home Zone
            </label>

            <button
              type="button"
              onClick={() =>
                handleChange({
                  target: {
                    name: 'is_home_zone',
                    type: 'checkbox',
                    checked: !formData.is_home_zone,
                    value: !formData.is_home_zone,
                  },
                })
              }
              className="toggle-switch"
              style={{
                width: '46px',
                height: '24px',
                borderRadius: '999px',
                background: formData.is_home_zone
                  ? 'var(--primary)'
                  : '#d0d4df',
                position: 'relative',
                transition: '0.2s',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: formData.is_home_zone ? '24px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  transition: '0.2s',
                }}
              />
            </button>
          </div>

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
