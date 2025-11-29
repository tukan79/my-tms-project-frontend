// src/components/list/DriverList.jsx
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import api from '@/services/api.js';
import DataTable from '@/components/shared/DataTable.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

// Sonar: unikamy bezpośredniego używania window.*
const confirmAction = (message) => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function') {
    return globalThis.confirm(message);
  }
  return false;
};

const DriverList = ({ items, onRefresh, onEdit }) => {
  const { showToast } = useToast();

  const safeDrivers = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  const columns = useMemo(
    () => [
      {
        key: 'first_name',
        header: 'Name',
        sortable: true,
        render: (driver) =>
          `${driver?.first_name ?? ''} ${driver?.last_name ?? ''}`.trim(),
      },
      {
        key: 'license_number',
        header: "Driver's License",
        sortable: true,
      },
      {
        key: 'phone_number',
        header: 'Phone',
        sortable: true,
      },
      {
        key: 'cpc_number',
        header: 'CPC',
        sortable: true,
        render: (driver) => driver?.cpc_number || 'N/A',
      },
      {
        key: 'login_code',
        header: 'Login Code',
        sortable: true,
        render: (driver) => driver?.login_code || 'N/A',
      },
      {
        key: 'is_active',
        header: 'Status',
        sortable: true,
        render: (driver) => {
          const isActive = Boolean(driver?.is_active);
          return (
            <span className={`status ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleDelete = useCallback(
    async (driver) => {
      if (!driver?.id) {
        showToast('Invalid driver record.', 'error');
        return;
      }

      const confirmed = confirmAction(
        `Are you sure you want to delete driver ${driver.first_name} ${driver.last_name}?`
      );

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(`/api/drivers/${driver.id}`);
        showToast('Driver deleted successfully.', 'success');
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        showToast(
          error?.response?.data?.error || 'Failed to delete driver.',
          'error'
        );
      }
    },
    [onRefresh, showToast]
  );

  return (
    <DataTable
      items={safeDrivers}
      columns={columns}
      onRefresh={onRefresh}
      onEdit={onEdit}
      onDelete={handleDelete}
      title="Driver List"
      filterPlaceholder="Filter drivers..."
      initialSortKey="first_name"
      filterKeys={[
        'first_name',
        'last_name',
        'license_number',
        'cpc_number',
        'login_code',
      ]}
    />
  );
};

DriverList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
};

DriverList.defaultProps = {
  items: [],
  onRefresh: undefined,
  onEdit: undefined,
};

export default DriverList;
