import React from 'react';
import DataTable from '@/components/shared/DataTable.jsx';

const UserList = (props) => {
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

  return (
    <DataTable
      {...props} // Przekazujemy wszystkie propsy (items, onEdit, onDelete, etc.)
      columns={columns}
      title="User List"
      filterPlaceholder="Search users..."
      initialSortKey="name"
      filterKeys={['email', 'role', 'first_name', 'last_name']}
    />
  );
};

export default UserList;
// ostatnia zmiana (30.05.2024, 13:14:12)