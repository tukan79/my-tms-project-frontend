import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';

import { useApiResource } from '@/hooks/useApiResource.js';
import { useToast } from '@/contexts/ToastContext.jsx';
import { useForm } from '@/hooks/useForm.js';

/* --------------------------------------
   SAFE CONFIRM DIALOG
--------------------------------------- */
const confirmAction = (msg) => {
  if (typeof globalThis?.confirm === 'function') {
    return globalThis.confirm(msg);
  }
  return false;
};

/* --------------------------------------
   INITIAL FORM STATE
--------------------------------------- */
const initialFormData = {
  code: '',
  name: '',
  description: '',
  calculation_method: 'per_order',
  amount: 0,
  is_automatic: false,
  requires_time: false,
  start_time: '',
  end_time: '',
};

/* --------------------------------------
   MAIN COMPONENT
--------------------------------------- */
const SurchargeTypesManager = () => {
  const {
    data: surcharges,
    createResource,
    updateResource,
    deleteResource,
    fetchData,
  } = useApiResource('/api/surcharge-types');

  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  /* --------------------------------------
      HANDLE FORM SUBMIT
  --------------------------------------- */
  const handleFormSubmit = async (formData) => {
    try {
      if (editingItem) {
        await updateResource(editingItem.id, formData);
        showToast('Surcharge type updated successfully!', 'success');
      } else {
        await createResource(formData);
        showToast('Surcharge type created successfully!', 'success');
      }

      setIsFormOpen(false);
      setEditingItem(null);
      fetchData();

    } catch (error) {
      showToast(
        error?.response?.data?.error ||
          'Failed to save surcharge type.',
        'error'
      );
      throw error;
    }
  };

  /* --------------------------------------
      useForm HOOK WITH INITIAL STATE
  --------------------------------------- */
  const { formData, handleChange, handleSubmit, loading } = useForm({
    initialState: initialFormData,

    itemToEdit: useMemo(
      () =>
        editingItem
          ? {
              ...editingItem,
              start_time: editingItem.start_time
                ? editingItem.start_time.substring(0, 5)
                : '',
              end_time: editingItem.end_time
                ? editingItem.end_time.substring(0, 5)
                : '',
            }
          : null,
      [editingItem]
    ),

    onSubmit: handleFormSubmit,
  });

  /* --------------------------------------
      DELETE SURCHARGE TYPE
  --------------------------------------- */
  const handleDelete = async (id) => {
    const ok = confirmAction(
      'Are you sure you want to delete this surcharge type?'
    );
    if (!ok) return;

    try {
      await deleteResource(id);
      showToast('Surcharge type deleted.', 'success');
      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
          'Failed to delete surcharge type.',
        'error'
      );
    }
  };

  /* --------------------------------------
      CONTROL OPEN/CLOSE FORM
  --------------------------------------- */
  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsFormOpen(false);
  };

  /* --------------------------------------
      RENDER
  --------------------------------------- */
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2>Surcharge Types</h2>

        {!isFormOpen && (
          <button
            onClick={handleAddNew}
            className="btn-primary"
          >
            <Plus size={16} /> Add New
          </button>
        )}
      </div>

      {/* ---------------- FORM ---------------- */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="form"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--surface)',
          }}
        >
          <h4>
            {editingItem
              ? 'Edit Surcharge Type'
              : 'Add New Surcharge Type'}
          </h4>

          <div className="form-group">
            <label>Code *</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Calculation Method</label>
            <select
              name="calculation_method"
              value={formData.calculation_method}
              onChange={handleChange}
            >
              <option value="per_order">Per Order</option>
              <option value="per_pallet_space">
                Per Pallet Space
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount (£)</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>

          {/* CHECKBOXES */}
          <div className="form-group checkbox-row">
            <input
              type="checkbox"
              id="is_automatic"
              name="is_automatic"
              checked={formData.is_automatic}
              onChange={handleChange}
            />
            <label htmlFor="is_automatic">Automatic</label>
          </div>

          <div className="form-group checkbox-row">
            <input
              type="checkbox"
              id="requires_time"
              name="requires_time"
              checked={formData.requires_time}
              onChange={handleChange}
            />
            <label htmlFor="requires_time">
              Requires Time Window
            </label>
          </div>

          {formData.requires_time && (
            <>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* ---------------- TABLE ---------------- */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Automatic</th>
              <th>Time?</th>
              <th>Start</th>
              <th>End</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {surcharges.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.name}</td>

                <td style={{ textTransform: 'capitalize' }}>
                  {item.calculation_method?.replace('_', ' ') ||
                    ''}
                </td>

                <td>£{Number(item.amount).toFixed(2)}</td>

                <td>{item.is_automatic ? 'Yes' : 'No'}</td>
                <td>{item.requires_time ? 'Yes' : 'No'}</td>

                <td>{item.start_time || '-'}</td>
                <td>{item.end_time || '-'}</td>

                <td className="actions-cell">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SurchargeTypesManager;
