import React from 'react';
import PropTypes from 'prop-types';

import api from '@/services/api.js';
import DataTable from '@/components/shared/DataTable.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const TruckList = ({ items, onRefresh, onEdit }) => {
  const safeTrucks = Array.isArray(items) ? items : [];

  const { showToast } = useToast();

  const columns = [
    { key: 'registration_plate', header: 'Registration', sortable: true },

    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
      render: (t) => t.brand ?? '-',
    },
    {
      key: 'model',
      header: 'Model',
      sortable: true,
      render: (t) => t.model ?? '-',
    },
    {
      key: 'vin',
      header: 'VIN',
      sortable: true,
      render: (t) => t.vin ?? '-',
    },
    {
      key: 'production_year',
      header: 'Year',
      sortable: true,
      render: (t) => t.production_year ?? '-',
    },
    {
      key: 'type_of_truck',
      header: 'Vehicle Type',
      sortable: true,
      render: (t) => t.type_of_truck ?? '-',
    },
    {
      key: 'total_weight',
      header: 'Total Weight (kg)',
      sortable: true,
      render: (truck) => {
        const isRigid = truck.type_of_truck === 'rigid';
        const hasValue = Boolean(truck.total_weight);
        return isRigid && hasValue
          ? `${truck.total_weight} kg`
          : '-';
      },
    },
    {
      key: 'pallet_capacity',
      header: 'Pallet Capacity',
      sortable: true,
      render: (truck) => {
        const isRigid = truck.type_of_truck === 'rigid';
        const hasValue = Boolean(truck.pallet_capacity);
        return isRigid && hasValue
          ? truck.pallet_capacity
          : '-';
      },
    },
    {
      key: 'max_payload_kg',
      header: 'Payload (kg)',
      sortable: true,
      render: (truck) => {
        const isRigid = truck.type_of_truck === 'rigid';
        const hasValue = Boolean(truck.max_payload_kg);
        return isRigid && hasValue
          ? `${truck.max_payload_kg} kg`
          : '-';
      },
    },
  ];

  const handleDelete = async (truck) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete vehicle ${truck.registration_plate}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/trucks/${truck.id}`);

      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });

      showToast('Vehicle deleted successfully.', 'success');
      onRefresh();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
          'Failed to delete vehicle.',
        'error'
      );
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
      filterKeys={[
        'registration_plate',
        'brand',
        'model',
        'vin',
        'type_of_truck',
        'production_year',
      ]}
    />
  );
};

TruckList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

TruckList.defaultProps = {
  items: [],
};

export default TruckList;
