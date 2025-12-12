// src/components/forms/AddDriverForm.jsx
import React from "react";
import PropTypes from "prop-types";

import { useForm } from "@/hooks/useForm.js";
import { useToast } from "@/contexts/ToastContext.jsx";

import TextField from "./fields/TextField.jsx";
import FormHeader from "./shared/FormHeader.jsx";
import FormActions from "./shared/FormActions.jsx";

import { validateDriver } from "./validators/driverValidator.js";
import { createDriver, updateDriver } from "./services/driverService.js";

const initialFormData = {
  first_name: "",
  last_name: "",
  phone_number: "",
  license_number: "",
  cpc_number: "",
  login_code: "",
  is_active: true,
};

const AddDriverForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const performSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateDriver(itemToEdit.id, data);
      } else {
        await createDriver(data);
      }

      showToast(
        `Driver ${isEditMode ? "updated" : "created"} successfully.`,
        "success"
      );
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save driver.";
      showToast(msg, "error");
      throw new Error(msg);
    }
  };

  const { formData, errors, loading, handleChange, handleSubmit } = useForm({
    initialState: initialFormData,
    validate: validateDriver,
    onSubmit: performSubmit,
    itemToEdit,
  });

  return (
    <div className="card modal-center form-card">
      {/* HEADER */}
      <FormHeader
        title={isEditMode ? "Edit Driver" : "Add New Driver"}
        subtitle="Enter driver details, identifiers and system credentials"
        onCancel={onCancel}
      />

      {errors.form && <div className="error-banner">{errors.form}</div>}

      {/* FORM */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid-1col">
          <h4 className="form-section-title">Driver Details</h4>

          <TextField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            required
          />

          <TextField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
            required
          />

          <TextField
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />

          <TextField
            label="License Number"
            name="license_number"
            value={formData.license_number}
            onChange={handleChange}
          />

          <TextField
            label="CPC Number"
            name="cpc_number"
            value={formData.cpc_number}
            onChange={handleChange}
          />

          <TextField
            label="Login Code"
            name="login_code"
            value={formData.login_code}
            onChange={handleChange}
          />

          {/* MODERN TOGGLE */}
          <div className="toggle-field">
            <label htmlFor="is_active" className="toggle-label">
              Active
            </label>

            <button
              type="button"
              onClick={() =>
                handleChange({
                  target: {
                    name: "is_active",
                    type: "checkbox",
                    checked: !formData.is_active,
                  },
                })
              }
              className={`toggle-switch ${
                formData.is_active ? "active" : ""
              }`}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <FormActions
          onCancel={onCancel}
          loading={loading}
          submitLabel={isEditMode ? "Save Changes" : "Add Driver"}
        />
      </form>
    </div>
  );
};

AddDriverForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemToEdit: PropTypes.object,
};

AddDriverForm.defaultProps = {
  itemToEdit: null,
};

export default AddDriverForm;
