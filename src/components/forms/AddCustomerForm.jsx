// src/components/forms/AddCustomerForm.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";

import { useToast } from "@/contexts/ToastContext.jsx";
import { useForm } from "@/hooks/useForm.js";

import TextField from "./fields/TextField.jsx";
import SelectField from "./fields/SelectField.jsx";
import FormHeader from "./shared/FormHeader.jsx";
import FormActions from "./shared/FormActions.jsx";

import { validateCustomer } from "./validators/customerValidator.js";
import {
  createCustomer,
  updateCustomer,
} from "./services/customerService.js";

const initialFormData = {
  customer_code: "",
  name: "",
  address_line1: "",
  address_line2: "",
  address_line3: "",
  address_line4: "",
  postcode: "",
  phone_number: "",
  country_code: "GB",
  category: "",
  currency: "GBP",
  vat_number: "",
  payment_terms: "30",
  status: "active",
  pod_on_portal: false,
  invoice_on_portal: false,
  handheld_status_on_portal: false,
  eta_status_on_portal: false,
  general_status_on_portal: false,
};

const AddCustomerForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const handleSave = async (formData) => {
    try {
      if (isEditMode) {
        await updateCustomer(itemToEdit.id, formData);
      } else {
        await createCustomer(formData);
      }

      showToast(
        isEditMode ? "Customer updated successfully!" : "Customer created successfully!",
        "success"
      );

      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.error || "Unexpected error occurred.";
      showToast(msg, "error");
      throw new Error(msg);
    }
  };

  const { formData, errors, loading, handleChange, handleSubmit } = useForm({
    initialState: initialFormData,
    validate: validateCustomer,
    onSubmit: handleSave,
    itemToEdit,
  });

  const currencyOptions = useMemo(
    () => [
      { value: "GBP", label: "GBP (£)" },
      { value: "EUR", label: "EUR (€)" },
      { value: "USD", label: "USD ($)" },
    ],
    []
  );

  return (
    <div className="card modal-center form-card">
      <FormHeader
        title={isEditMode ? "Edit Customer" : "Add New Customer"}
        subtitle="Enter customer details and billing preferences"
        onCancel={onCancel}
      />

      {errors.form && <div className="error-banner">{errors.form}</div>}

      <form onSubmit={handleSubmit} noValidate>

        {/* GRID LAYOUT */}
        <div className="form-grid-2col">
          {/* LEFT SECTION */}
          <div>
            <h4 className="form-section-title">Main Details</h4>

            <TextField
              label="Customer Code"
              name="customer_code"
              required
              value={formData.customer_code}
              onChange={handleChange}
              error={errors.customer_code}
            />

            <TextField
              label="Customer Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
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
              type="number"
              label="Payment Terms (days)"
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
            />

            <SelectField
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              options={currencyOptions}
            />
          </div>

          {/* RIGHT SECTION */}
          <div>
            <h4 className="form-section-title">Address & Contact</h4>

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
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>
        </div>

        <FormActions
          onCancel={onCancel}
          loading={loading}
          submitLabel={isEditMode ? "Save Changes" : "Add Customer"}
        />
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
