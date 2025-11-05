// plik TrailerList.jsx
import React, { useState } from 'react';
import api from '@/services/api.js';
import DataTable from '@/components/shared/DataTable.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const TrailerList = ({ items: trailers = [], onRefresh, onEdit }) => {
  // Zabezpieczenie: Gwarantujemy, że `trailers` jest zawsze tablicą.
  const safeTrailers = Array.isArray(trailers) ? trailers : [];
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = [
    { key: 'registration_plate', header: 'Trailer Code', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    // 🟡 2. Formatowanie wartości liczbowych
    { key: 'max_payload_kg', header: 'Payload (kg)', sortable: true, render: (t) => t.max_payload_kg ?? '-' },
    { key: 'max_spaces', header: 'Spaces', sortable: true, render: (t) => t.max_spaces ?? '-' },
    { key: 'length_m', header: 'Length (m)', sortable: true, render: (t) => t.length_m ?? '-' },
    { key: 'status', header: 'Status', sortable: true, render: (trailer) => (
      // 🟡 1. Ulepszony status (czytelność + fallback)
      <span className={`status ${trailer.status || 'unknown'}`}>
        {trailer.status || 'Unknown'}
      </span>
    )},
  ];

  const { showToast } = useToast();

  // 🟡 3. Ulepszony feedback po usunięciu
  const handleDelete = async (trailer) => {
    if (window.confirm(`Are you sure you want to delete trailer ${trailer.registration_plate}?`)) {
      setIsDeleting(true);
      try {
        await api.delete(`/api/trailers/${trailer.id}`);
        showToast('Trailer deleted successfully.', 'success');
        onRefresh();
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete trailer.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <DataTable
      items={safeTrailers}
      columns={columns}
      onRefresh={onRefresh}
      onEdit={onEdit}
      onDelete={isDeleting ? () => {} : handleDelete} // Blokada przycisku podczas usuwania
      title="Trailer List"
      filterPlaceholder="Filter trailers..."
      initialSortKey="registration_plate"
      filterKeys={['registration_plate', 'description', 'category', 'status']}
    />
  );
};

export default TrailerList;
// ostatnia zmiana (30.05.2024, 13:14:12)