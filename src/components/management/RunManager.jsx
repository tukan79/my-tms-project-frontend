// plik RunManager.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import AddRunForm from '../forms/AddRunForm.jsx';
import DataTable from '../shared/DataTable.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

const RunManager = ({ runs = [], trucks = [], trailers = [], drivers = [], onDataRefresh, runActions }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRun, setEditingRun] = useState(null);
  const { showToast } = useToast();

  // Safeguard against undefined props during render cycles.
  const safeRuns = Array.isArray(runs) ? runs : [];
  const safeTrucks = Array.isArray(trucks) ? trucks : [];
  const safeTrailers = Array.isArray(trailers) ? trailers : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];

  const handleAddNewRun = useCallback(() => {
    setEditingRun(null);
    setIsFormVisible(true);
  }, []);

  const handleEditRun = useCallback((run) => {
    setEditingRun(run);
    setIsFormVisible(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setIsFormVisible(false);
    setEditingRun(null);
  }, []);

  const handleSaveRun = useCallback(async (runData) => {
    try {
      if (editingRun) {
        await runActions.update(editingRun.id, runData);
      } else {
        await runActions.create(runData);
      }
      showToast('Run saved successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to save run.', 'error');
    }
    handleCancelForm();
  }, [onDataRefresh, handleCancelForm]);

  const driverMap = useMemo(() => new Map(safeDrivers.map(d => [d.id, `${d.first_name} ${d.last_name}`])), [safeDrivers]);
  const truckMap = useMemo(() => new Map(safeTrucks.map(t => [t.id, t.registration_plate])), [safeTrucks]);
  const trailerMap = useMemo(() => new Map(safeTrailers.map(t => [t.id, t.registration_plate])), [safeTrailers]);

  const enrichedRuns = useMemo(() => safeRuns.map(run => ({
    ...run,
    driverName: driverMap.get(run.driver_id) || 'N/A',
    truckPlate: truckMap.get(run.truck_id) || 'N/A',
    trailerPlate: run.trailer_id ? trailerMap.get(run.trailer_id) : 'N/A',
  })), [safeRuns, driverMap, truckMap, trailerMap]);

  const columns = [
    {
      key: 'run_date',
      header: 'Date',
      sortable: true,
      render: (item) => new Date(item.run_date).toLocaleDateString(),
    },
    {
      key: 'driverName',
      header: 'Driver',
      sortable: true,
    },
    {
      key: 'truckPlate',
      header: 'Truck',
      sortable: true,
    },
    {
      key: 'trailerPlate',
      header: 'Trailer',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item) => <span style={{textTransform: 'capitalize'}}>{item.type}</span>
    },
  ];

  const handleDeleteRun = useCallback(async (run) => {
    // Znajdź wzbogacone dane, aby wyświetlić czytelną nazwę w potwierdzeniu
    const enrichedRun = enrichedRuns.find(r => r.id === run.id);
    const driverName = enrichedRun?.driverName || 'N/A';
    const runDate = new Date(run.run_date).toLocaleDateString();

    if (window.confirm(`Are you sure you want to delete run for ${driverName} on ${runDate}?`)) {
      try {
        await runActions.delete(run.id);
        showToast('Run deleted successfully.', 'success');
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete run.', 'error');
      }
    }
  }, [runActions, showToast, enrichedRuns]);

  return (
    <div className="card">
      {isFormVisible && (
        <div className="modal-overlay">
          <AddRunForm
            onSuccess={handleSaveRun}
            onCancel={handleCancelForm}
            itemToEdit={editingRun}
            drivers={drivers}
            trucks={trucks}
            trailers={trailers}
          />
        </div>
      )}

      <div className="card-header">
        <h3>Run Management</h3>
        <button onClick={handleAddNewRun} className="btn-primary">
          <Plus size={16} /> Add New Run
        </button>
      </div>

      <DataTable
        items={enrichedRuns}
        columns={columns}
        onEdit={handleEditRun}
        onDelete={handleDeleteRun}
        filterPlaceholder="Filter runs..."
        filterKeys={['run_date', 'driverName', 'truckPlate', 'trailerPlate', 'type']}
        initialSortKey="run_date"
        initialSortOrder="desc"
        // Usunięto prop `actions`, ponieważ DataTable używa `onEdit` i `onDelete`
      />
    </div>
  );
};

export default RunManager;
// ostatnia zmiana (30.05.2024, 13:14:12)