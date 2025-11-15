import React from 'react';
import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';

const initialFormData = {
  first_name: '',
  last_name: '',
  phone_number: '',
  license_number: '',
  cpc_number: '',
  login_code: '',
  is_active: true,
};

const AddDriverForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const { showToast } = useToast();

  const performSubmit = async (formData) => {
    const endpoint = itemToEdit ? `/api/drivers/${itemToEdit.id}` : '/api/drivers';
    const method = itemToEdit ? 'put' : 'post';

    try {
      await apimethod;
      showToast(`Driver ${itemToEdit ? 'updated' : 'added'} successfully.`, 'success');
      if (onSuccess) onSuccess();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save driver.';
      showToast(message, 'error');
      throw new Error(message);
    }
  };

  const { formData, loading, handleChange, handleSubmit } = useForm({
    initialState: initialFormData,
    onSubmit: performSubmit,
    itemToEdit,
  });

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2>{itemToEdit ? 'Edit Driver' : 'Add New Driver'}</h2>
      {/* Tutaj dodaj pola formularza dla kierowcy, np. first_name, last_name, etc. */}
      <p>Form fields for the driver go here.</p>
      <div className="form-actions"><button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button></div>
    </form>
  );
};

export default AddDriverForm;