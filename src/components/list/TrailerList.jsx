// src/components/list/TrailerList.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import api from '@/services/api.js';
import DataTable from '@/components/shared/DataTable.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const TrailerList = ({ items, onRefresh, onEdit }) => {
  const safeTrailers = Array.isArray(items) ? items : [];
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const columns = [
    { key: 'registration_plate', header: 'Trailer Code', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'max_payload_kg',
      header: 'Payload (kg)',
      sortable: true,
      render: (t) => (t.max_payload_kg ?? '-'),
    },
    {
      key: 'max_spaces',
      header: 'Spaces',
      sortable: true,
      render: (t) => (t.max_spaces ?? '-'),
    },
    {
      key: 'length_m',
      header: 'Length (m)',
      sortable: true,
      render: (t) => (t.length_m ?? '-'),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (trailer) => (
        <span className={`status ${trailer.status || 'unknown'}`}>
          {trailer.status || 'Unknown'}
        </span>
      ),
    },
  ];

  const handleDelete = async (trailer) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete trailer ${trailer.registration_plate}?`
    );

    if (confirmed !== true) {
      return;
    }

    setIsDeleting(true);

    try {
      await api.delete(`/api/trailers/${trailer.id}`);
      showToast('Trailer deleted successfully.', 'success');
      onRefresh();
    } catch (error) {
      showToast(
        error.response?.data?.error || 'Failed to delete trailer.',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const safeDeleteHandler = isDeleting
    ? () => {}
    : handleDelete;

  return (
    <DataTable
      items={safeTrailers}
      columns={columns}
      onRefresh={onRefresh}
      onEdit={onEdit}
      onDelete={safeDeleteHandler}
      title="Trailer List"
      filterPlaceholder="Filter trailers..."
      initialSortKey="registration_plate"
      filterKeys={[
        'registration_plate',
        'description',
        'category',
        'status',
      ]}
    />
  );
};

/* ✅ SonarQube: Prop types */
TrailerList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

TrailerList.defaultProps = {
  items: [],
};

export default TrailerList;
