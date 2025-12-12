// src/components/forms/AddRateEntryForm.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import FormHeader from './shared/FormHeader.jsx';
import FormActions from './shared/FormActions.jsx';

const initialData = {
  customer_id: '',
  zone_id: '',
  rate: '',
  description: '',
};

const AddRateEntryForm = ({
  onSubmit,
  onCancel,
  rateToEdit,
  customers = [],
  zones = [],
}) => {

  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (rateToEdit) {
      setFormData({
        customer_id: rateToEdit.customer_id ?? '',
        zone_id: rateToEdit.zone_id ?? '',
        rate: rateToEdit.rate ?? '',
        description: rateToEdit.description ?? '',
      });
    }
  }, [rateToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <div className="card modal-center form-card">
      <FormHeader
        title={rateToEdit ? 'Edit Rate Entry' : 'Add New Rate Entry'}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} noValidate>

        {/* ---- GRID ---- */}
        <div className="form-grid-2col">

          <SelectField
            label="Customer"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            required
            options={customers.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />

          <SelectField
            label="Zone"
            name="zone_id"
            value={formData.zone_id}
            onChange={handleChange}
            required
            options={zones.map((z) => ({
              value: z.id,
              label: z.zoneName || z.zone_name,
            }))}
          />

          <TextField
            label="Rate (£)"
            name="rate"
            type="number"
            required
            value={formData.rate}
            onChange={handleChange}
          />

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />

        </div>

        {/* ---- ACTIONS ---- */}
        <FormActions
          onCancel={onCancel}
          submitLabel={rateToEdit ? 'Save Changes' : 'Add Rate'}
        />
      </form>
    </div>
  );
};

AddRateEntryForm.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  rateToEdit: PropTypes.object,
  customers: PropTypes.arrayOf(PropTypes.object),
  zones: PropTypes.arrayOf(PropTypes.object),
};

AddRateEntryForm.defaultProps = {
  onSubmit: undefined,
  rateToEdit: null,
  customers: [],
  zones: [],
};

export default AddRateEntryForm;
