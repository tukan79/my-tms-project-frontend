import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AddRateEntryForm = ({ onSubmit, onCancel, rateToEdit, customers = [], zones = [] }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    zone_id: '',
    rate: '',
    description: '',
  });

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="page-card form">
      <h2>{rateToEdit ? 'Edit Rate Entry' : 'Add Rate Entry'}</h2>

      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="form-group">
          <label htmlFor="customer_id">Customer</label>
          <select
            id="customer_id"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="zone_id">Zone</label>
          <select
            id="zone_id"
            name="zone_id"
            value={formData.zone_id}
            onChange={handleChange}
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.zoneName || z.zone_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rate">Rate</label>
          <input
            id="rate"
            name="rate"
            type="number"
            step="0.01"
            value={formData.rate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {rateToEdit ? 'Update Rate' : 'Add Rate'}
        </button>
      </div>
    </form>
  );
};

AddRateEntryForm.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  rateToEdit: PropTypes.object,
  customers: PropTypes.array,
  zones: PropTypes.array,
};

AddRateEntryForm.defaultProps = {
  onSubmit: undefined,
  onCancel: undefined,
  rateToEdit: null,
  customers: [],
  zones: [],
};

export default AddRateEntryForm;
