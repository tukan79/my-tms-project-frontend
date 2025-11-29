import React from 'react';
import PropTypes from 'prop-types';

import DataTable from '@/components/shared/DataTable.jsx';

const UserList = ({ items, onEdit, onDelete, onRefresh }) => {
  const safeUsers = Array.isArray(items) ? items : [];

  const getRoleLabel = (role) => {
    if (role === 'admin') {
      return 'Admin';
    }
    if (role === 'dispatcher') {
      return 'Dispatcher';
    }
    return '-';
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => {
        const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();

        if (fullName.length > 0) {
          return fullName;
        }

        return user.email ?? '-';
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (u) => u.email ?? '-',
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => getRoleLabel(u.role),
    },
  ];

  return (
    <DataTable
      items={safeUsers}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
      onRefresh={onRefresh}
      title="User List"
      filterPlaceholder="Search users..."
      initialSortKey="name"
      filterKeys={['email', 'role', 'first_name', 'last_name']}
    />
  );
};

UserList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func,
};

UserList.defaultProps = {
  items: [],
  onEdit: undefined,
  onDelete: undefined,
  onRefresh: undefined,
};

export default UserList;
