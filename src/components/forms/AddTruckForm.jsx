// plik AddTruckForm.jsx

import React from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import { useForm } from '../hooks/useForm.js';
import { useToast } from '../contexts/ToastContext.jsx';

const AddTruckForm = ({ onSuccess, onCancel, itemToEdit }) => {
  const isEditMode = Boolean(itemToEdit); // Use the renamed prop
  const initialFormData = {
    registration_plate: '',
    brand: '',
    model: '',
    vin: '',
    production_year: '',
    type_of_truck: 'tractor',
    total_weight: '',
    pallet_capacity: '',
    max_payload_kg: '',
    is_active: true
  };

  const { showToast } = useToast();

  const validate = (data) => {
    const newErrors = {};
    if (!data.registration_plate) newErrors.registration_plate = 'Registration plate is required.';
    if (!data.brand) newErrors.brand = 'Brand is required.';
    if (!data.model) newErrors.model = 'Model is required.';
    if (data.type_of_truck === 'rigid') {
      if (!data.total_weight) newErrors.total_weight = 'Total weight is required.';
      if (!data.pallet_capacity) newErrors.pallet_capacity = 'Pallet capacity is required.';
      if (!data.max_payload_kg) newErrors.max_payload_kg = 'Max payload is required.';
    }
    return newErrors;
  };

  const performSubmit = async (formData) => {
    const dataToSend = {
      ...formData,
      production_year: formData.production_year ? Number(formData.production_year) : null,
      total_weight: formData.type_of_truck === 'rigid' && formData.total_weight ? Number(formData.total_weight) : null,
      pallet_capacity: formData.type_of_truck === 'rigid' && formData.pallet_capacity ? Number(formData.pallet_capacity) : null,
      max_payload_kg: formData.type_of_truck === 'rigid' && formData.max_payload_kg ? Number(formData.max_payload_kg) : null,
    };
  
    const request = isEditMode
      ? api.put(`/api/trucks/${itemToEdit.id}`, dataToSend)
      : api.post('/api/trucks', dataToSend);
  
    try {
      await request;
      showToast(`Vehicle ${isEditMode ? 'updated' : 'added'} successfully!`, 'success');
      onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error || `An error occurred while ${isEditMode ? 'updating' : 'adding'} the vehicle.`;
      showToast(errorMessage, 'error');
      throw new Error(errorMessage); // Re-throw to be caught by useForm
    }
  };

  const {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
  } = useForm({ initialState: initialFormData, validate, onSubmit: performSubmit, itemToEdit });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
        <button onClick={onCancel} className="btn-icon">
          <X size={20} />
        </button>
      </div>
      {errors.form && <div className="error-message">{errors.form}</div>}
      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="form-group">
          <label>Brand:</label>
          <input 
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={handleChange}
            required
            className={errors.brand ? 'input-error' : ''}
          />
          {errors.brand && <span className="error-text">{errors.brand}</span>}
        </div>
        <div className="form-group">
          <label>Model:</label>
          <input 
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={handleChange}
            required
            className={errors.model ? 'input-error' : ''}
          />
          {errors.model && <span className="error-text">{errors.model}</span>}
        </div>
        <div className="form-group">
          <label>Registration Plate:</label>
          <input 
            type="text"
            name="registration_plate"
            value={formData.registration_plate || ''}
            onChange={handleChange}
            required
            className={errors.registration_plate ? 'input-error' : ''}
          />
          {errors.registration_plate && <span className="error-text">{errors.registration_plate}</span>}
        </div>
        <div className="form-group">
          <label>VIN:</label>
          <input 
            type="text"
            name="vin"
            value={formData.vin || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Production Year:</label>
          <input 
            type="number"
            name="production_year"
            value={formData.production_year || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Vehicle Type:</label>
          <select
            name="type_of_truck"
            value={formData.type_of_truck}
            onChange={handleChange}
            required
          >
            <option value="tractor">Tractor Unit</option>
            <option value="rigid">Rigid Truck</option>
          </select>
        </div>

        {/* ✅ Warunkowe renderowanie nowych pól */}
        {formData.type_of_truck === 'rigid' && (
          <>
            <div className="form-group">
              <label>Total Weight (kg) *</label>
              <input 
                type="number"
                name="total_weight"
                value={formData.total_weight || ''}
                onChange={handleChange}
                required
                className={errors.total_weight ? 'input-error' : ''}
              />
              {errors.total_weight && <span className="error-text">{errors.total_weight}</span>}
            </div>
            <div className="form-group">
              <label>Pallet Capacity *</label>
              <input 
                type="number"
                name="pallet_capacity"
                value={formData.pallet_capacity || ''}
                onChange={handleChange}
                required
                className={errors.pallet_capacity ? 'input-error' : ''}
              />
              {errors.pallet_capacity && <span className="error-text">{errors.pallet_capacity}</span>}
            </div>
            <div className="form-group">
              <label>Max Payload (kg) *</label>
              <input
                type="number"
                name="max_payload_kg"
                value={formData.max_payload_kg || ''}
                onChange={handleChange}
                required
                className={errors.max_payload_kg ? 'input-error' : ''}
              />
              {errors.max_payload_kg && <span className="error-text">{errors.max_payload_kg}</span>}
            </div>
          </>
        )}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Vehicle')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTruckForm;
// ostatnia zmiana (30.05.2024, 13:14:12)