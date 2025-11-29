// src/components/forms/shared/FormActions.jsx
import React from 'react';
import PropTypes from 'prop-types';

const FormActions = ({
  onCancel,
  loading,
  submitLabel,
  cancelLabel = 'Cancel',
  submitDisabled = false,
}) => (
  <div className="form-actions">
    <button
      type="button"
      onClick={onCancel}
      className="btn-secondary"
      disabled={loading}
    >
      {cancelLabel}
    </button>

    <button
      type="submit"
      className="btn-primary"
      disabled={loading || submitDisabled}
    >
      {submitLabel}
    </button>
  </div>
);

FormActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  submitLabel: PropTypes.string.isRequired,
  cancelLabel: PropTypes.string,
  submitDisabled: PropTypes.bool,
};

FormActions.defaultProps = {
  loading: false,
  cancelLabel: 'Cancel',
  submitDisabled: false,
};

export default FormActions;
