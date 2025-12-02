import React from 'react';
import PropTypes from 'prop-types';

import api from '@/services/api.js';
import DataTable from '@/components/shared/DataTable.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const TruckList = ({ items, onRefresh, onEdit }) => {
  const safeTrucks = Array.isArray(items) ? items : [];

  const { showToast } = useToast();

  const columns = [
    {
      key: 'registration_plate',
      header: 'Registration',
      sortable: true,
      render: (t) => t.registration_plate || t.registrationPlate || '-',
    },

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
      render: (t) => t.production_year || t.productionYear || '-',
    },
    {
      key: 'type_of_truck',
      header: 'Vehicle Type',
      sortable: true,
      render: (t) => t.type_of_truck || t.typeOfTruck || '-',
    },
    {
      key: 'total_weight',
      header: 'Total Weight (kg)',
      sortable: true,
      render: (truck) => {
        const type = truck.type_of_truck || truck.typeOfTruck;
        const weight = truck.total_weight || truck.totalWeight;
        const isRigid = type === 'rigid';
        const hasValue = Boolean(weight);
        return isRigid && hasValue
          ? `${weight} kg`
          : '-';
      },
    },
    {
      key: 'pallet_capacity',
      header: 'Pallet Capacity',
      sortable: true,
      render: (truck) => {
        const type = truck.type_of_truck || truck.typeOfTruck;
        const capacity = truck.pallet_capacity || truck.palletCapacity;
        const isRigid = type === 'rigid';
        const hasValue = Boolean(capacity);
        return isRigid && hasValue
          ? capacity
          : '-';
      },
    },
    {
      key: 'max_payload_kg',
      header: 'Payload (kg)',
      sortable: true,
      render: (truck) => {
        const type = truck.type_of_truck || truck.typeOfTruck;
        const payload = truck.max_payload_kg || truck.maxPayloadKg;
        const isRigid = type === 'rigid';
        const hasValue = Boolean(payload);
        return isRigid && hasValue
          ? `${payload} kg`
          : '-';
      },
    },
  ];

  const handleDelete = async (truck) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete vehicle ${truck.registration_plate || truck.registrationPlate}?`
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
        'registration_plate', 'registrationPlate',
        'brand',
        'model',
        'vin',
        'type_of_truck', 'typeOfTruck',
        'production_year', 'productionYear',
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
