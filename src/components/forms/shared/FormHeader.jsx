// src/components/forms/shared/FormHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const FormHeader = ({ title, onCancel }) => (
  <div className="form-header">
    <h2>{title}</h2>
    <button
      type="button"
      onClick={onCancel}
      className="btn-icon"
      aria-label="Close form"
    >
      <X size={20} />
    </button>
  </div>
);

FormHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default FormHeader;
