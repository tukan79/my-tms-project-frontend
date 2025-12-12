// src/components/forms/fields/TextField.jsx
import React from "react";
import PropTypes from "prop-types";

const TextField = ({
  label,
  name,
  value,
  onChange,
  error,
  type,
  required,
  disabled,
  placeholder,
}) => {
  return (
    <div className="form-group modern-field">
      {/* Label */}
      <label htmlFor={name} className="modern-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>

      {/* Input */}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`modern-input ${error ? "input-error" : ""}`}
      />

      {/* Error */}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};

TextField.defaultProps = {
  error: "",
  type: "text",
  required: false,
  disabled: false,
  placeholder: "",
};

export default TextField;
