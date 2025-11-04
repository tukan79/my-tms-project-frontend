// 📁 AddRateEntryForm.jsx
import React, { useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from '@/hooks/useForm.js';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';

const initialFormData = {
  rate_type: 'standard',
  zone_id: '',
  service_level: 'A',
  price_micro: '',
  price_quarter: '',
  price_half: '',
  price_half_plus: '',
  price_full_1: '',
  price_full_2: '',
  price_full_3: '',
  price_full_4: '',
  price_full_5: '',
  price_full_6: '',
  price_full_7: '',
  price_full_8: '',
  price_full_9: '',
  price_full_10: '',
};

const priceColumns = [
  'price_micro', 'price_quarter', 'price_half', 'price_half_plus',
  'price_full_1', 'price_full_2', 'price_full_3', 'price_full_4', 'price_full_5',
  'price_full_6', 'price_full_7', 'price_full_8', 'price_full_9', 'price_full_10'
];

const AddRateEntryForm = ({ zones = [], onCancel, onSuccess, itemToEdit, autoRefreshTrigger }) => {
  const { showToast } = useToast();
  const isEditMode = Boolean(itemToEdit);
  const firstErrorRef = useRef(null);

  const validate = (data) => {
    const newErrors = {};
    if (!data.zone_id) newErrors.zone_id = 'Zone is required.';
    if (!data.service_level) newErrors.service_level = 'Service level is required.';
    return newErrors;
  };

  const performSubmit = async (formData) => {
    const endpoint = isEditMode ? `/api/rates/${itemToEdit.id}` : '/api/rates';
    const method = isEditMode ? 'put' : 'post';

    try {
      await api[method](endpoint, formData);
      showToast(`Rate entry ${isEditMode ? 'updated' : 'added'} successfully.`, 'success');
      if (onSuccess) onSuccess();

      // Odświeżenie z zewnątrz, jeśli przekazano callback
      if (typeof autoRefreshTrigger === 'function') {
        autoRefreshTrigger();
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save rate entry.';
      showToast(message, 'error');
      throw new Error(message);
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
    itemToEdit: useMemo(() => itemToEdit, [itemToEdit]),
  });

  // ⏩ Focus na pierwsze błędne pole
  useEffect(() => {
    if (Object.keys(errors).length && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [errors]);

  return (
    <div className="card">
      {/* Nagłówek */}
      <div className="flex justify-between items-center mb-4">
        <h2>{isEditMode ? 'Edit Rate Entry' : 'Add New Rate Entry'}</h2>
        <button onClick={onCancel} className="btn-icon" title="Close">
          <X size={20} />
        </button>
      </div>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="form" autoComplete="off">
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {/* Typ taryfy */}
          <div className="form-group">
            <label>Rate Type</label>
            <select name="rate_type" value={formData.rate_type} onChange={handleChange}>
              <option value="standard">Standard</option>
              <option value="surcharge">Surcharge</option>
            </select>
          </div>

          {/* Strefa */}
          <div className="form-group">
            <label>Zone *</label>
            <select
              name="zone_id"
              value={formData.zone_id}
              onChange={handleChange}
              required
              ref={errors.zone_id && !firstErrorRef.current ? firstErrorRef : null}
              className={errors.zone_id ? 'input-error' : ''}
            >
              <option value="">Select a zone...</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.zone_name}
                </option>
              ))}
            </select>
            {errors.zone_id && <span className="error-text">{errors.zone_id}</span>}
          </div>

          {/* Poziom serwisu */}
          <div className="form-group">
            <label>Service Level *</label>
            <select
              name="service_level"
              value={formData.service_level}
              onChange={handleChange}
              required
              ref={errors.service_level && !firstErrorRef.current ? firstErrorRef : null}
              className={errors.service_level ? 'input-error' : ''}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            {errors.service_level && <span className="error-text">{errors.service_level}</span>}
          </div>
        </div>

        {/* Cennik */}
        <h4>Prices</h4>
        <div
          className="form-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
        >
          {priceColumns.map(col => (
            <div className="form-group" key={col}>
              <label style={{ textTransform: 'capitalize' }}>
                {col.replace('price_', '').replace(/_/g, ' ')}
              </label>
              <input
                type="number"
                step="0.01"
                name={col}
                value={formData[col] ?? ''}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
              />
            </div>
          ))}
        </div>

        {/* Akcje */}
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRateEntryForm;

// ✅ Ostatnia aktualizacja: 04.11.2025
// - obsługa trybu edycji
// - walidacja z auto-focusem
// - integracja z ToastContext
// - gotowe do połączenia z auto-refresh w panelu nadrzędnym
