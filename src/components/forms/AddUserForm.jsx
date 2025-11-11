import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';

const AddUserForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit);
  const { showToast } = useToast();

  // 🧱 Stan formularza
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'dispatcher',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ Ustaw dane do edycji tylko raz
  useEffect(() => {
    if (isEditMode && itemToEdit) {
      setFormData({
        email: itemToEdit.email || '',
        first_name: itemToEdit.first_name || '',
        last_name: itemToEdit.last_name || '',
        password: '',
        role: itemToEdit.role || 'dispatcher',
      });
    }
  }, [isEditMode, itemToEdit]);

  // ✏️ Obsługa zmian pól
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 🧩 Walidacja
  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required.';
    if (!formData.first_name) newErrors.first_name = 'First name is required.';
    if (!formData.last_name) newErrors.last_name = 'Last name is required.';
    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }
    return newErrors;
  }, [formData, isEditMode]);

  // 📨 Submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/api/users/${itemToEdit.id}`, {
          role: formData.role,
          first_name: formData.first_name,
          last_name: formData.last_name,
        });
        showToast('✅ User updated successfully!', 'success');
      } else {
        await api.post('/api/users', formData);
        showToast('✅ User created successfully!', 'success');
      }

      onSuccess();
    } catch (err) {
      console.error('Full API error:', err);
      const errorMessage =
        err.response?.data?.error || err.message || 'An error occurred.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, itemToEdit, onSuccess, showToast, validate]);

  // 🧱 Render
  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h2>{isEditMode ? 'Edit User' : 'Add New User'}</h2>
        <button onClick={onCancel} className="btn-icon">
          <X size={20} />
        </button>
      </div>

      {errors.form && <div className="error-message">{errors.form}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isEditMode}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className={errors.first_name ? 'input-error' : ''}
          />
          {errors.first_name && (
            <span className="error-text">{errors.first_name}</span>
          )}
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className={errors.last_name ? 'input-error' : ''}
          />
          {errors.last_name && (
            <span className="error-text">{errors.last_name}</span>
          )}
        </div>

        {!isEditMode && (
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="dispatcher">Dispatcher</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading
              ? isEditMode
                ? 'Saving...'
                : 'Adding...'
              : isEditMode
              ? 'Save Changes'
              : 'Add User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserForm;
