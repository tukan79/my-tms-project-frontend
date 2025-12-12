// src/components/shared/ConfirmationModal.jsx
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, X } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  /* -------------------------------------------------------
     OPEN / CLOSE DIALOG SAFELY
  ------------------------------------------------------- */
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal?.();

      // Trap focus on confirm button initially
      confirmBtnRef.current?.focus();

      // Disable body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      if (dialog.open) dialog.close?.();

      document.body.style.overflow = "";
    }
  }, [isOpen]);

  /* -------------------------------------------------------
     CLOSE WHEN CLICK OUTSIDE DIALOG CONTENT
  ------------------------------------------------------- */
  const handleClickOutside = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.querySelector(".modal-content")?.getBoundingClientRect();
    const clickedInside =
      rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!clickedInside) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal-overlay fade-in"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleClickOutside}
    >
      <div className="modal-content card scale-in" tabIndex={-1}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-icon modal-close-button"
          aria-label="Close modal"
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div className="modal-header">
          <AlertTriangle size={48} className="text-danger" aria-hidden="true" />
          <h2 id="confirmation-modal-title" className="modal-title">
            {title || "Confirm Action"}
          </h2>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p>{message || "Are you sure you want to perform this action?"}</p>
        </div>

        {/* Footer Buttons */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="button"
            ref={confirmBtnRef}
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
