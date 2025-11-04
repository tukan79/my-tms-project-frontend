import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fade-in"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal-content card scale-in" tabIndex={-1}>
        <button onClick={onClose} className="btn-icon modal-close-button">
          <X size={24} />
        </button>
        <div className="modal-header">
          <AlertTriangle size={48} className="text-danger" />
          <h2 className="modal-title">{title || 'Confirm Action'}</h2>
        </div>
        <div className="modal-body">
          <p>{message || 'Are you sure you want to perform this action?'}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" autoFocus>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
