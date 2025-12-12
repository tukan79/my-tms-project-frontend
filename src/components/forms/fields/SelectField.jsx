// src/components/forms/fields/SelectField.jsx
import React from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  error,
  options,
  required,
  disabled,
  placeholder,
}) => {
  return (
    <div className="form-group modern-field">
      {/* LABEL */}
      <label htmlFor={name} className="modern-label">
        {label} {required && <span className="required-star">*</span>}
      </label>

      {/* WRAPPER to allow icon layering */}
      <div className="select-wrapper">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`modern-select ${error ? "input-error" : ""}`}
        >
          <option value="">
            {placeholder || "Select..."}
          </option>

          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <ChevronDown size={18} className="select-chevron" />
      </div>

      {/* ERROR MESSAGE */}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

SelectField.defaultProps = {
  error: "",
  required: false,
  disabled: false,
  placeholder: "Select…",
};

export default SelectField;
