// plik TruckList.jsx

import React from 'react';
import api from '../services/api.js';
import DataTable from '../shared/DataTable.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const TruckList = ({ items: trucks = [], onRefresh, onEdit }) => {
  // Ensure that `trucks` is always an array to prevent errors in child components.
  const safeTrucks = Array.isArray(trucks) ? trucks : [];

  const columns = [
    { key: 'registration_plate', header: 'Registration', sortable: true },
    { key: 'brand', header: 'Brand', sortable: true, render: (t) => t.brand || '-' },
    { key: 'model', header: 'Model', sortable: true, render: (t) => t.model || '-' },
    { key: 'vin', header: 'VIN', sortable: true, render: (t) => t.vin || '-' },
    { key: 'production_year', header: 'Year', sortable: true, render: (t) => t.production_year || '-' },
    { key: 'type_of_truck', header: 'Vehicle Type', sortable: true, render: (t) => t.type_of_truck || '-' },
    { key: 'total_weight', header: 'Total Weight (kg)', sortable: true, render: (truck) => truck.type_of_truck === 'rigid' && truck.total_weight ? `${truck.total_weight} kg` : '-' },
    { key: 'pallet_capacity', header: 'Pallet Capacity', sortable: true, render: (truck) => truck.type_of_truck === 'rigid' && truck.pallet_capacity ? truck.pallet_capacity : '-' },
    { key: 'max_payload_kg', header: 'Payload (kg)', sortable: true, render: (truck) => truck.type_of_truck === 'rigid' && truck.max_payload_kg ? `${truck.max_payload_kg} kg` : '-' },
  ];

  const { showToast } = useToast();

  const handleDelete = async (truck) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${truck.registration_plate}?`)) {
      try {
        await api.delete(`/api/trucks/${truck.id}`);
        await new Promise(r => setTimeout(r, 250)); // UX: Krótki delay
        showToast('Vehicle deleted successfully.', 'success');
        onRefresh();
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete vehicle.', 'error');
      }
    }
  };

  return (
    <DataTable
      items={safeTrucks}
      columns={columns}
      onRefresh={onRefresh}
      onEdit={onEdit}
      onDelete={handleDelete}
      title="Truck List"
      filterPlaceholder="Filter vehicles..."
      initialSortKey="registration_plate"
      filterKeys={['registration_plate', 'brand', 'model', 'vin', 'type_of_truck', 'production_year']}
    />
  );
};

export default TruckList;
// ostatnia zmiana (30.05.2024, 13:14:12)