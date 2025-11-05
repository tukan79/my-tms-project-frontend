import React from 'react';
import { X } from 'lucide-react';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useForm } from '../hooks/useForm.js';

const initialFormData = {
  zone_name: '',
  postcode_patterns: '',
  is_home_zone: false,
};
const AddZoneForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  const validate = (data) => {
    const newErrors = {};
    if (!data.zone_name) newErrors.zone_name = 'Zone name is required.';
    if (!data.postcode_patterns) newErrors.postcode_patterns = 'Postcode patterns are required.';
    return newErrors;
  };

  const performSubmit = async (formData) => {
    const payload = {
      ...formData,
      postcode_patterns: formData.postcode_patterns.split(';').map(p => p.trim()).filter(Boolean),
    };

    const request = isEditMode
      ? api.put(`/api/zones/${itemToEdit.id}`, payload)
      : api.post('/api/zones', payload);
    try {
      await request;
      showToast(`Zone ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unexpected error occurred.';
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }
  };

  const {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
  } = useForm({
    initialState: initialFormData,
    validate,
    onSubmit: performSubmit,
    itemToEdit: itemToEdit ? { ...itemToEdit, postcode_patterns: (itemToEdit.postcode_patterns || []).join('; ') } : null,
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isEditMode ? 'Edit Zone' : 'Add New Zone'}</h2>
        <button onClick={onCancel} className="btn-icon"><X size={20} /></button>
      </div>
      {errors.form && <div className="error-message">{errors.form}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Zone Name *</label>
          <input type="text" name="zone_name" value={formData.zone_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Postcode Patterns (semicolon-separated, e.g., SW1%; W1A; EC%) *</label>
          <textarea name="postcode_patterns" value={formData.postcode_patterns} onChange={handleChange} required rows="3" />
        </div>
        <div className="form-group"><label><input type="checkbox" name="is_home_zone" checked={formData.is_home_zone} onChange={handleChange} /> Is Home Zone?</label></div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Zone'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddZoneForm;
// ostatnia zmiana (30.05.2024, 13:14:12)