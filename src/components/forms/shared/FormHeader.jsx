// src/components/forms/shared/FormHeader.jsx
import React from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";

const FormHeader = ({ title, onCancel, subtitle }) => {
  return (
    <div className="form-header-modern">
      <div className="form-header-text">
        <h2>{title}</h2>
        {subtitle && <p className="form-subtitle">{subtitle}</p>}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="btn-icon header-close-btn"
        aria-label="Close form"
      >
        <X size={20} />
      </button>
    </div>
  );
};

FormHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
};

FormHeader.defaultProps = {
  subtitle: "",
};

export default FormHeader;
