import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  XCircle,
  Download,
  Upload,
} from 'lucide-react';

import AddRateEntryForm from './forms/AddRateEntryForm.jsx';
import DataImporter from './DataImporter.jsx';

/* --------------------------------------
   Safe helpers (no direct window usage)
--------------------------------------- */

const confirmAction = (message) => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.confirm === 'function'
  ) {
    return globalThis.confirm(message);
  }
  return false;
};

const getUrlApi = () =>
  typeof globalThis === 'undefined' ? null : globalThis.URL;

/* --------------------------------------
   MAIN COMPONENT
--------------------------------------- */

const RateCardEditor = ({ customers = [], zones = [] }) => {
  const [rateCards, setRateCards] = useState([]);
  const [selectedRateCardId, setSelectedRateCardId] = useState('');
  const [rateEntries, setRateEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [assignedCustomers, setAssignedCustomers] = useState([]);
  const [customersToAssign, setCustomersToAssign] = useState([]);

  const { showToast } = useToast();

  /* --------------------------------------
     FETCH RATE CARDS
  --------------------------------------- */
  useEffect(() => {
    const fetchRateCards = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/rate-cards');
        const raw = response.data;
        const data = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.rateCards)
              ? raw.rateCards
              : [];
        setRateCards(data);
      } catch (error) {
        console.error('Fetch rate cards failed', error);
        showToast('Failed to fetch rate cards.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRateCards();
  }, [showToast]);

  /* --------------------------------------
     FETCH RATE ENTRIES
  --------------------------------------- */
  const fetchRateEntries = useCallback(async () => {
    if (!selectedRateCardId) {
      setRateEntries([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(
        `/api/rate-cards/${selectedRateCardId}/entries`
      );
      setRateEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        `Failed to fetch rate entries for rate card ${selectedRateCardId}.`;
      console.error('Fetch rate entries failed', error);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRateCardId, showToast]);

  /* --------------------------------------
     FETCH ASSIGNED CUSTOMERS
  --------------------------------------- */
  const fetchAssignedCustomers = useCallback(async () => {
    if (!selectedRateCardId) {
      setAssignedCustomers([]);
      return;
    }

    try {
      const response = await api.get(
        `/api/rate-cards/${selectedRateCardId}/customers`
      );

      const data = response.data;
      let customersFromResponse = [];

      if (Array.isArray(data)) {
        customersFromResponse = data;
      } else if (Array.isArray(data?.customers)) {
        customersFromResponse = data.customers;
      }

      setAssignedCustomers(customersFromResponse);
    } catch (error) {
      console.error('Fetch assigned customers failed', error);
      showToast('Failed to fetch assigned customers.', 'error');
    }
  }, [selectedRateCardId, showToast]);

  /* --------------------------------------
     REACT TO RATE CARD CHANGE
  --------------------------------------- */
  useEffect(() => {
    setShowAddForm(false);
    setShowImporter(false);
    setEditingEntry(null);

    if (selectedRateCardId) {
      fetchRateEntries();
      fetchAssignedCustomers();
    }
  }, [selectedRateCardId, fetchRateEntries, fetchAssignedCustomers]);

  /* --------------------------------------
     CREATE RATE CARD
  --------------------------------------- */
  const handleCreateRateCard = async () => {
    const name = typeof globalThis?.prompt === 'function'
      ? globalThis.prompt(
          'Enter a name for the new rate card (e.g., "Standard 2024"):'
        )
      : null;

    if (!name) return;

    try {
      const response = await api.post('/api/rate-cards', { name });
      setRateCards((prev) => [...prev, response.data]);
      showToast('Rate card created.', 'success');
    } catch (error) {
      console.error('Create rate card failed', error);
      showToast('Failed to create rate card.', 'error');
    }
  };

  const handleDeleteRateCard = async () => {
    if (!selectedRateCardId) {
      showToast('Select a rate card first.', 'warning');
      return;
    }

    const confirmed = confirmAction(
      'Delete this rate card? This will remove all its entries and assignments.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/rate-cards/${selectedRateCardId}`);
      setRateCards((prev) => prev.filter((rc) => rc.id !== selectedRateCardId));
      setSelectedRateCardId('');
      setRateEntries([]);
      setAssignedCustomers([]);
      setShowAddForm(false);
      setShowImporter(false);
      showToast('Rate card deleted.', 'success');
    } catch (error) {
      console.error('Delete rate card failed', error);
      showToast('Failed to delete rate card.', 'error');
    }
  };

  /* --------------------------------------
     CUSTOMER ASSIGNMENT
  --------------------------------------- */
  const handleBulkAssignCustomers = async () => {
    if (!selectedRateCardId || customersToAssign.length === 0) {
      showToast(
        'Please select a rate card and at least one customer.',
        'warning'
      );
      return;
    }

    try {
      await api.post(`/api/rate-cards/${selectedRateCardId}/customers`, {
        customerIds: customersToAssign,
      });

      await fetchAssignedCustomers();
      setCustomersToAssign([]);
      showToast(
        `${customersToAssign.length} customer(s) assigned successfully.`,
        'success'
      );
    } catch (error) {
      console.error('Assign customers failed', error);
      showToast('Failed to assign customers.', 'error');
    }
  };

  const handleUnassignCustomer = async (customerId) => {
    if (!selectedRateCardId || !customerId) return;

    try {
      await api.delete(
        `/api/rate-cards/${selectedRateCardId}/customers/${customerId}`
      );
      await fetchAssignedCustomers();
      showToast('Customer unassigned.', 'success');
    } catch (error) {
      console.error('Unassign customer failed', error);
      showToast('Failed to unassign customer.', 'error');
    }
  };

  /* --------------------------------------
     CREATE RATE ENTRY
  --------------------------------------- */
  const handleCreateRateEntry = async (entryData) => {
    if (!selectedRateCardId) return;

    try {
      const response = await api.post(
        `/api/rate-cards/${selectedRateCardId}/entries`,
        entryData
      );
      setRateEntries((prev) => [...prev, response.data]);
      setShowImporter(false);
      setShowAddForm(false);
      showToast('Rate entry added successfully!', 'success');
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error || 'Failed to add rate entry.';
      showToast(errorMessage, 'error');
      console.error(error);
    }
  };

  /* --------------------------------------
     IMPORT SUCCESS (DataImporter)
     UWAGA: DataImporter wywołuje onSuccess() BEZ argumentów
  --------------------------------------- */
  const handleImportSuccess = () => {
    setShowImporter(false);
    fetchRateEntries();
    showToast('Import finished successfully!', 'success');
  };

  /* --------------------------------------
     UPDATE RATE ENTRY
  --------------------------------------- */
  const handleUpdateRateEntry = async () => {
    if (!editingEntry) return;

    try {
      const response = await api.put(
        `/api/rate-cards/entries/${editingEntry.id}`,
        editingEntry
      );
      setRateEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingEntry.id ? response.data : entry
        )
      );
      setEditingEntry(null);
      showToast('Rate entry updated successfully!', 'success');
    } catch (error) {
      showToast(
        error?.response?.data?.error || 'Failed to update rate entry.',
        'error'
      );
    }
  };

  /* --------------------------------------
     DELETE RATE ENTRY
  --------------------------------------- */
  const handleDeleteRateEntry = async (entryId) => {
    const ok = confirmAction(
      'Are you sure you want to delete this rate entry?'
    );
    if (!ok) return;

    try {
      await api.delete(`/api/rate-cards/entries/${entryId}`);
      setRateEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      showToast('Rate entry deleted.', 'success');
    } catch (error) {
      console.error('Delete rate entry failed', error);
      showToast(
        error?.response?.data?.error || 'Failed to delete rate entry.',
        'error'
      );
    }
  };

  /* --------------------------------------
     EXPORT RATE CARD
  --------------------------------------- */
  const handleExport = async () => {
    if (!selectedRateCardId) return;

    try {
      const response = await api.get(
        `/api/rate-cards/${selectedRateCardId}/export`,
        { responseType: 'blob' }
      );

      const urlApi = getUrlApi();
      if (!urlApi) {
        showToast('Export is not supported in this environment.', 'error');
        return;
      }

      const blob = new Blob([response.data]);
      const url = urlApi.createObjectURL(blob);

      const rateCardName =
        rateCards.find((rc) => rc.id === selectedRateCardId)?.name ||
        'rate-card';
      const safeRateCardName = rateCardName.split(/\s+/).join('_');

      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeRateCardName}_export.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      urlApi.revokeObjectURL(url);

      showToast('Export started successfully!', 'success');
    } catch (error) {
      console.error('Export rate card failed', error);
      showToast('Failed to export rate card.', 'error');
    }
  };

  /* --------------------------------------
     INLINE EDIT HANDLER
  --------------------------------------- */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingEntry((prev) => ({
      ...prev,
      [name]: value === '' ? null : Number.parseFloat(value),
    }));
  };

  /* --------------------------------------
     CONSTANTS & MEMOS
  --------------------------------------- */
  const priceColumns = [
    'price_micro',
    'price_quarter',
    'price_half',
    'price_half_plus',
    'price_full_1',
    'price_full_2',
    'price_full_3',
    'price_full_4',
    'price_full_5',
    'price_full_6',
    'price_full_7',
    'price_full_8',
    'price_full_9',
    'price_full_10',
  ];

  const unassignedCustomers = useMemo(() => {
    const assignedIds = new Set(assignedCustomers.map((c) => c.id));
    return customers.filter((c) => !assignedIds.has(c.id));
  }, [customers, assignedCustomers]);

  /* --------------------------------------
     RENDER
  --------------------------------------- */

  return (
    <div>
      {/* TOP BAR: SELECT RATE CARD */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="rate-card-select">Select Rate Card</label>
          <select
            id="rate-card-select"
            value={selectedRateCardId}
            onChange={(e) => setSelectedRateCardId(e.target.value)}
          >
            <option value="">-- Select Rate Card --</option>
            {rateCards.map((rc) => (
              <option key={rc.id} value={rc.id}>
                {rc.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateRateCard}
          className="btn-secondary"
          style={{ alignSelf: 'flex-end' }}
        >
          <Plus size={16} /> New Rate Card
        </button>

        <button
          onClick={handleDeleteRateCard}
          className="btn-danger"
          style={{ alignSelf: 'flex-end' }}
          disabled={!selectedRateCardId}
          title="Delete selected rate card"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* MAIN GRID */}
      {selectedRateCardId && (
        <div
          className="form-grid"
          style={{
            gridTemplateColumns: '1fr 2fr',
            alignItems: 'stretch',
          }}
        >
          {/* LEFT: CUSTOMER ASSIGNMENT */}
          <div className="card">
            <h5>Assigned Customers</h5>

            <div className="form-group">
              <label htmlFor="assign-customers-select">
                Assign new customers
              </label>
              <select
                id="assign-customers-select"
                multiple
                value={customersToAssign}
                onChange={(e) =>
                  setCustomersToAssign(
                    Array.from(e.target.selectedOptions, (option) => option.value)
                  )
                }
                style={{ height: '150px', marginBottom: '1rem' }}
              >
                {unassignedCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkAssignCustomers}
                className="btn-primary"
                disabled={customersToAssign.length === 0}
              >
                Assign Selected ({customersToAssign.length})
              </button>
            </div>

            <ul
              className="list"
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                paddingLeft: 0,
                listStyle: 'none',
              }}
            >
              {assignedCustomers.map((c) => (
                <li key={c.id} className="list-item">
                  <span>{c.name}</span>
                  <button
                    onClick={() => handleUnassignCustomer(c.id)}
                    className="btn-icon btn-danger"
                    title="Unassign"
                  >
                    <XCircle size={16} />
                  </button>
                </li>
              ))}

              {assignedCustomers.length === 0 && (
                <p className="no-results-message">No customers assigned.</p>
              )}
            </ul>
          </div>

          {/* RIGHT: RATE ENTRIES */}
          <div
            className="card"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* ADD FORM */}
            {showAddForm && (
              <AddRateEntryForm
                zones={zones}
                onSubmit={handleCreateRateEntry}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* IMPORTER */}
            {showImporter && (
              <DataImporter
                title="Import Rate Entries"
                apiEndpoint={`/api/rate-cards/${selectedRateCardId}/entries/import`}
                postDataKey="entries"
                // surowe wiersze – walidacja po stronie backendu
                dataMappingFn={(row) => row}
                previewColumns={[
                  { key: 'rate_type', header: 'Rate Type' },
                  { key: 'zone_name', header: 'Zone Name' },
                  { key: 'service_level', header: 'Service Level' },
                ]}
                onSuccess={handleImportSuccess}
                onCancel={() => setShowImporter(false)}
              />
            )}

            {/* TABELA (gdy nie ma form/importera) */}
            {!showAddForm && !showImporter && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h5>Rate Entries</h5>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={handleExport}
                      className="btn-secondary"
                    >
                      <Download size={16} /> Export
                    </button>
                    <button
                      onClick={() => setShowImporter(true)}
                      className="btn-secondary"
                    >
                      <Upload size={16} /> Import
                    </button>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="btn-primary"
                    >
                      <Plus size={16} /> Add Rate
                    </button>
                  </div>
                </div>

                <div
                  className="table-wrapper"
                  style={{ marginTop: '1rem' }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Zone</th>
                        <th>Service</th>
                        {priceColumns.map((col) => (
                          <th
                            key={col}
                            style={{
                              minWidth: '100px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {col
                              .replace('price_', '')
                              .replaceAll('_', ' ')}
                          </th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {isLoading && (
                        <tr>
                          <td
                            colSpan={priceColumns.length + 4}
                            style={{ textAlign: 'center' }}
                          >
                            Loading...
                          </td>
                        </tr>
                      )}

                      {!isLoading &&
                        rateEntries.length > 0 &&
                        rateEntries.map((entry) => {
                          const zoneName =
                            zones.find((z) => z.id === entry.zone_id)
                              ?.zone_name || 'N/A';
                          const isEditing =
                            editingEntry?.id === entry.id;

                          return (
                            <tr key={entry.id}>
                              <td style={{ textTransform: 'capitalize' }}>
                                {entry.rate_type
                                  ?.replaceAll('_', ' ') || '—'}
                              </td>
                              <td>{zoneName}</td>
                              <td>{entry.service_level}</td>

                              {priceColumns.map((col) => (
                                <td key={`${entry.id}-${col}`}>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      name={col}
                                      value={
                                        editingEntry[col] ?? ''
                                      }
                                      onChange={handleEditChange}
                                      style={{ width: '80px' }}
                                      autoFocus={
                                        col === priceColumns[0]
                                      }
                                    />
                                  ) : (
                                    entry[col]
                                  )}
                                </td>
                              ))}

                              <td className="actions-cell">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={
                                        handleUpdateRateEntry
                                      }
                                      className="btn-icon"
                                      title="Save"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingEntry(null)
                                      }
                                      className="btn-icon"
                                      title="Cancel"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        setEditingEntry({
                                          ...entry,
                                        })
                                      }
                                      className="btn-icon"
                                      title="Edit Rate Entry"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteRateEntry(
                                          entry.id
                                        )
                                      }
                                      className="btn-icon btn-danger"
                                      title="Delete Rate Entry"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                      {!isLoading && rateEntries.length === 0 && (
                        <tr>
                          <td
                            colSpan={priceColumns.length + 4}
                            style={{ textAlign: 'center' }}
                          >
                            No rate entries found for this rate card.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

RateCardEditor.propTypes = {
  customers: PropTypes.arrayOf(PropTypes.object),
  zones: PropTypes.arrayOf(PropTypes.object),
};

export default RateCardEditor;
