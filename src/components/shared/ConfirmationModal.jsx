// src/components/shared/ConfirmationModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      className="modal-overlay fade-in"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      open
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="modal-content card scale-in"
        tabIndex={-1}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn-icon modal-close-button"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <div className="modal-header">
          <AlertTriangle size={48} className="text-danger" aria-hidden="true" />
          <h2 id="confirmation-modal-title" className="modal-title">
            {title || 'Confirm Action'}
          </h2>
        </div>

        <div className="modal-body">
          <p>{message || 'Are you sure you want to perform this action?'}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger"
          >
            Confirm
          </button>
        </div>
      </div>
    </dialog>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
};

export default ConfirmationModal;
