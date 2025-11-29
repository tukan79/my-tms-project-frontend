// src/components/list/CustomerList.jsx
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import DataTable from '@/components/shared/DataTable.jsx';
import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';

// Mały helper, żeby nie używać window.* (Sonar: S7764)
const confirmAction = (message) => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function') {
    return globalThis.confirm(message);
  }
  // fallback – np. środowisko testowe/SSR, traktujemy jak "anuluj"
  return false;
};

const CustomerList = ({ items, onRefresh, onEdit }) => {
  const { showToast } = useToast();

  const safeItems = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  const columns = useMemo(
    () => [
      { key: 'customer_code', header: 'Code' },
      { key: 'name', header: 'Name' },
      { key: 'address_line1', header: 'Address' },
      { key: 'postcode', header: 'Postcode' },
      { key: 'phone_number', header: 'Phone' },
      { key: 'vat_number', header: 'VAT Number' },
      {
        key: 'created_at',
        header: 'Creation Date',
        render: (item) =>
          item?.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : '—',
      },
    ],
    []
  );

  const handleDelete = useCallback(
    async (customer) => {
      if (!customer?.id) {
        showToast('Invalid customer record.', 'error');
        return;
      }

      const confirmed = confirmAction(
        `Are you sure you want to delete customer "${customer.name}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(`/api/customers/${customer.id}`);
        showToast('Customer deleted successfully.', 'success');
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        showToast(
          error?.response?.data?.error || 'Failed to delete customer.',
          'error'
        );
      }
    },
    [onRefresh, showToast]
  );

  return (
    <DataTable
      items={safeItems}
      columns={columns}
      onEdit={onEdit}
      onDelete={handleDelete}
      onRefresh={onRefresh}
      title="Customers"
      filterPlaceholder="Filter customers..."
      initialSortKey="name"
      filterKeys={['name', 'customer_code', 'postcode']}
    />
  );
};

CustomerList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
};

CustomerList.defaultProps = {
  items: [],
  onRefresh: undefined,
  onEdit: undefined,
};

export default CustomerList;
