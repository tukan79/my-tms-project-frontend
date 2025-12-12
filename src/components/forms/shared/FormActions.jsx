// src/components/forms/shared/FormActions.jsx
import React from "react";
import PropTypes from "prop-types";
import { Loader2 } from "lucide-react"; // elegancki spinner

const FormActions = ({
  onCancel,
  loading,
  submitLabel,
  cancelLabel = "Cancel",
  submitDisabled = false,
  sticky = false, // opcjonalny tryb sticky bottom bar
}) => {
  return (
    <div className={`form-actions-modern ${sticky ? "sticky-actions" : ""}`}>
      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        className="btn-ghost"
        disabled={loading}
      >
        {cancelLabel}
      </button>

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary"
        disabled={loading || submitDisabled}
      >
        {loading ? (
          <span className="loading-inline">
            <Loader2 className="spin" size={18} /> Saving...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
};

FormActions.propTypes = {
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  submitLabel: PropTypes.string.isRequired,
  cancelLabel: PropTypes.string,
  submitDisabled: PropTypes.bool,
  sticky: PropTypes.bool,
};

FormActions.defaultProps = {
  loading: false,
  cancelLabel: "Cancel",
  submitDisabled: false,
  sticky: false,
};

export default FormActions;
