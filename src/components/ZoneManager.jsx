import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Plus, Upload, Download, Edit, Trash2, X } from 'lucide-react';

import api from '@/services/api.js';
import DataImporter from './DataImporter.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

/* Utility functions for natural sorting */
const splitParts = (v) => v?.match(/(\d+)|(\D+)/g) ?? [];
const compareParts = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const pa = a[i], pb = b[i];
    const na = Number(pa), nb = Number(pb);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    if (pa !== pb) return pa.localeCompare(pb);
  }
  return a.length - b.length;
};

export default function ZoneManager({ zones = [], onRefresh }) {
  const { showToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [showImporter, setShowImporter] = useState(false);
  const [formData, setFormData] = useState({
    zone_name: '',
    postcode_patterns: '',
    is_home_zone: false,
  });

  /* ------------------------ Sorting ------------------------ */
  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) =>
      compareParts(
        splitParts(a.zone_name || a.zoneName),
        splitParts(b.zone_name || b.zoneName)
      )
    );
  }, [zones]);

  /* ------------------------ Form Prefill ------------------------ */
  useEffect(() => {
    if (editingZone) {
      setFormData({
        zone_name: editingZone.zone_name,
        postcode_patterns: editingZone.postcode_patterns.join(', '),
        is_home_zone: editingZone.is_home_zone,
      });
      setFormOpen(true);
    }
  }, [editingZone]);

  /* ------------------------ Save Zone ------------------------ */
  const handleSave = async (e) => {
    e.preventDefault();

    const patterns = formData.postcode_patterns
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (p.endsWith('%') ? p : p + '%'));

    const unique = [...new Set(patterns)];
    const payload = { ...formData, postcode_patterns: unique };

    try {
      if (editingZone) {
        await api.put(`/api/zones/${editingZone.id}`, payload);
        showToast('Zone updated!', 'success');
      } else {
        await api.post(`/api/zones`, payload);
        showToast('Zone created!', 'success');
      }
      setFormOpen(false);
      setEditingZone(null);
      onRefresh?.();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save zone.', 'error');
    }
  };

  /* ------------------------ Delete Zone ------------------------ */
  const handleDelete = async (id) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await api.delete(`/api/zones/${id}`);
      showToast('Zone deleted.', 'success');
      onRefresh?.();
    } catch {
      showToast('Failed to delete zone.', 'error');
    }
  };

  /* ------------------------ Remove Pattern ------------------------ */
  const handleRemovePattern = async (zone, pattern) => {
    const updated = zone.postcode_patterns.filter((p) => p !== pattern);
    try {
      await api.put(`/api/zones/${zone.id}`, {
        postcode_patterns: updated,
      });
      showToast(`Removed pattern '${pattern}'.`, 'success');
      onRefresh?.();
    } catch {
      showToast('Failed to remove pattern.', 'error');
    }
  };

  /* ------------------------ Drag & Drop ------------------------ */
  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const pattern = draggableId.split('--')[1];
    const sourceId = Number(source.droppableId);
    const destId = Number(destination.droppableId);

    const src = sortedZones.find((z) => z.id === sourceId);
    const dst = sortedZones.find((z) => z.id === destId);

    const updatedSrc = src.postcode_patterns.filter((p) => p !== pattern);
    const updatedDst = [...dst.postcode_patterns, pattern];

    try {
      await Promise.all([
        api.put(`/api/zones/${src.id}`, {
          postcode_patterns: updatedSrc,
        }),
        api.put(`/api/zones/${dst.id}`, {
          postcode_patterns: [...new Set(updatedDst)],
        }),
      ]);
      showToast('Pattern moved!', 'success');
      onRefresh?.();
    } catch {
      showToast('Failed to move pattern.', 'error');
    }
  };

  /* ------------------------ Export ------------------------ */
  const handleExport = async () => {
    try {
      const res = await api.get('/api/zones/export');
      showToast(res.data?.message || 'Zones exported!', 'success');
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  /* ------------------------ Importer Config ------------------------ */
  const importerConfig = {
    title: 'Import Postcode Zones',
    apiEndpoint: '/api/zones/import',
    postDataKey: 'zones',
    dataMappingFn: (row) => ({
      zone_name: row.zone_name,
      postcode_patterns: row.postcode_patterns
        ? row.postcode_patterns.split(';').map((p) => p.trim())
        : [],
      is_home_zone: ['true', '1', 'yes'].includes(String(row.is_home_zone).toLowerCase()),
    }),
    previewColumns: [
      { key: 'zone_name', header: 'Zone' },
      { key: 'postcode_patterns', header: 'Patterns' },
      { key: 'is_home_zone', header: 'Home?', render: (i) => (i.is_home_zone ? 'Yes' : 'No') },
    ],
  };

  return (
    <div className="card">
      <h3>Postcode Zones</h3>

      {/* ACTION BAR */}
      {!formOpen && !showImporter && (
        <div className="zone-actions">
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Add Zone
          </button>
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="btn-secondary" onClick={() => setShowImporter(true)}>
            <Upload size={16} /> Import
          </button>
        </div>
      )}

      {/* IMPORTER */}
      {showImporter && (
        <DataImporter
          {...importerConfig}
          onSuccess={() => {
            showToast('Zones imported!', 'success');
            setShowImporter(false);
            onRefresh?.();
          }}
          onCancel={() => setShowImporter(false)}
        />
      )}

      {/* FORM */}
      {formOpen && (
        <form className="zone-form-card" onSubmit={handleSave}>
          <h4>{editingZone ? 'Edit Zone' : 'Create Zone'}</h4>

          <div className="form-group">
            <label>Zone Name</label>
            <input
              type="text"
              required
              value={formData.zone_name}
              onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Postcode Patterns (comma-separated)</label>
            <textarea
              rows={3}
              value={formData.postcode_patterns}
              onChange={(e) =>
                setFormData({ ...formData, postcode_patterns: e.target.value })
              }
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="is_home_zone"
              checked={formData.is_home_zone}
              onChange={(e) =>
                setFormData({ ...formData, is_home_zone: e.target.checked })
              }
            />
            <label htmlFor="is_home_zone">Home Zone</label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormOpen(false);
                setEditingZone(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      )}

      {/* TABLE */}
      {!formOpen && !showImporter && (
        <div className="table-wrapper">
          <DragDropContext onDragEnd={onDragEnd}>
            <table className="zone-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Home</th>
                  <th>Patterns</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedZones.map((zone) => (
                  <Droppable key={zone.id} droppableId={String(zone.id)}>
                    {(drop) => (
                      <tr
                        ref={drop.innerRef}
                        {...drop.droppableProps}
                        className={drop.isDraggingOver ? 'dropzone-highlight' : ''}
                      >
                        {/* ZONE NAME */}
                        <td>{zone.zone_name}</td>

                        {/* HOME BADGE */}
                        <td>
                          {zone.is_home_zone ? (
                            <span className="boolean-badge boolean-yes">Yes</span>
                          ) : (
                            <span className="boolean-badge boolean-no">No</span>
                          )}
                        </td>

                        {/* PATTERNS */}
                        <td>
                          <div className="zone-chip-container">
                            {zone.postcode_patterns.map((p, idx) => (
                              <Draggable
                                key={zone.id + '--' + p}
                                draggableId={zone.id + '--' + p}
                                index={idx}
                              >
                                {(drag) => (
                                  <div
                                    ref={drag.innerRef}
                                    {...drag.draggableProps}
                                    {...drag.dragHandleProps}
                                  >
                                    <span className="zone-chip">
                                      {p}
                                      <button
                                        className="close-btn"
                                        type="button"
                                        onClick={() => handleRemovePattern(zone, p)}
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {drop.placeholder}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td className="actions-cell">
                          <button
                            className="btn-icon"
                            onClick={() => setEditingZone(zone)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(zone.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )}
                  </Droppable>
                ))}
              </tbody>
            </table>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}

ZoneManager.propTypes = {
  zones: PropTypes.array,
  onRefresh: PropTypes.func,
};
