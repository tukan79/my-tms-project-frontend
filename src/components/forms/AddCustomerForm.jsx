// src/components/forms/AddCustomerForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

import { useToast } from '@/contexts/ToastContext.jsx';
import { useForm } from '@/hooks/useForm.js';

import TextField from './fields/TextField.jsx';
import { validateCustomer } from './validators/customerValidator.js';
import { createCustomer, updateCustomer } from './services/customerService.js';

const initialFormData = {
  customer_code: '',
  name: '',
  address_line1: '',
  address_line2: '',
  address_line3: '',
  address_line4: '',
  postcode: '',
  phone_number: '',
  country_code: 'GB',
  category: '',
  currency: 'GBP',
  vat_number: '',
  payment_terms: '30',
  status: 'active',
  pod_on_portal: false,
  invoice_on_portal: false,
  handheld_status_on_portal: false,
  eta_status_on_portal: false,
  general_status_on_portal: false,
};

const AddCustomerForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const performSubmit = async (formData) => {
    try {
      if (isEditMode) {
        await updateCustomer(itemToEdit.id, formData);
      } else {
        await createCustomer(formData);
      }

      showToast(
        `Customer ${isEditMode ? 'updated' : 'added'} successfully!`,
        'success'
      );
      onSuccess();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || 'Unexpected error occurred.';
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
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
    validate: validateCustomer,
    onSubmit: performSubmit,
    itemToEdit,
  });

  return (
    <div className="card">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</h2>
        <button type="button" onClick={onCancel} className="btn-icon">
          <X size={20} />
        </button>
      </div>

      {errors.form && <div className="error-message">{errors.form}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-column">
            <h4>Main Details</h4>

            <TextField
              label="Customer Code"
              name="customer_code"
              value={formData.customer_code}
              onChange={handleChange}
              error={errors.customer_code}
              required
            />

            <TextField
              label="Customer Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />

            <TextField
              label="VAT Number"
              name="vat_number"
              value={formData.vat_number}
              onChange={handleChange}
            />

            <TextField
              label="Payment Terms (days)"
              name="payment_terms"
              type="number"
              value={formData.payment_terms}
              onChange={handleChange}
            />

            <TextField
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
            />
          </div>

          <div className="form-column">
            <h4>Address & Contact</h4>

            <TextField
              label="Address Line 1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
            />

            <TextField
              label="Address Line 2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
            />

            <TextField
              label="Address Line 3"
              name="address_line3"
              value={formData.address_line3}
              onChange={handleChange}
            />

            <TextField
              label="Address Line 4"
              name="address_line4"
              value={formData.address_line4}
              onChange={handleChange}
            />

            <TextField
              label="Country Code"
              name="country_code"
              value={formData.country_code}
              onChange={handleChange}
            />

            <TextField
              label="Postcode"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
            />

            <TextField
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              type="tel"
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

AddCustomerForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddCustomerForm.defaultProps = {
  itemToEdit: null,
};

export default AddCustomerForm;
