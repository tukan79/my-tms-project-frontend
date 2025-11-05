import React from 'react';
import api from '@/services/api';
import DataTable from '@/components/shared/DataTable.jsx';
import { useToast } from '@/contexts/ToastContext.jsx';

const UserList = ({ items: users = [], onRefresh, onEdit, currentUser }) => {
  // Ensure that `users` is always an array to prevent errors in child components.
  const safeUsers = Array.isArray(users) ? users : [];

  const { showToast } = useToast();

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || '-',
    },
    { key: 'email', header: 'Email', sortable: true, render: (u) => u.email || '-' },
    { 
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) =>
        u.role === 'admin'
          ? 'Admin'
          : u.role === 'dispatcher'
          ? 'Dispatcher'
          : '-',
    },
  ];

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      showToast("You cannot delete your own account.", "error");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user ${user.email}?`)) {
      try {
        await api.delete(`/api/users/${user.id}`);
        showToast('User deleted successfully.', 'success');
        onRefresh();
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete user.', 'error');
      }
    }
  };
  
  return (
    <DataTable
      items={safeUsers}
      columns={columns}
      onRefresh={onRefresh}
      onEdit={onEdit}
      onDelete={handleDelete}
      title="User List"
      filterPlaceholder="Search users..."
      initialSortKey="name"
      filterKeys={['email', 'role', 'first_name', 'last_name']}
      currentUser={currentUser}
    />
  );
};

export default UserList;
// ostatnia zmiana (30.05.2024, 13:14:12)