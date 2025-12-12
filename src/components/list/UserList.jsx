// src/components/list/UserList.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";

import DataTable from "@/components/shared/DataTable.jsx";
import { User, Mail, Shield } from "lucide-react";

/* Role tag renderer */
const renderRoleTag = (role) => {
  if (!role) return <span className="status status-unknown">Unknown</span>;

  const label =
    role === "admin"
      ? "Admin"
      : role === "dispatcher"
      ? "Dispatcher"
      : role;

  return <span className={`status status-${role}`}>{label}</span>;
};

const UserList = ({ items, onEdit, onDelete, onRefresh }) => {
  const safeUsers = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  /* ----------------------------------
          TABLE COLUMNS (SaaS)
  ---------------------------------- */
  const columns = [
    {
      key: "name",
      header: (
        <div className="table-col-header">
          <User size={14} /> Name
        </div>
      ),
      sortable: true,
      render: (user) => {
        const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
        return fullName || user.email || "—";
      },
    },
    {
      key: "email",
      header: (
        <div className="table-col-header">
          <Mail size={14} /> Email
        </div>
      ),
      sortable: true,
      render: (u) => u.email ?? "—",
    },
    {
      key: "role",
      header: (
        <div className="table-col-header">
          <Shield size={14} /> Role
        </div>
      ),
      sortable: true,
      render: (u) => renderRoleTag(u.role),
    },
  ];

  /* ----------------------------------
                RENDER
  ---------------------------------- */
  return (
    <div className="card">
      {/* Modern Header */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Users</h2>
          <p className="text-muted small">
            {safeUsers.length} system users
          </p>
        </div>
      </div>

      <DataTable
        items={safeUsers}
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        onRefresh={onRefresh}
        title="User List"
        filterPlaceholder="Search users..."
        initialSortKey="name"
        filterKeys={["email", "role", "first_name", "last_name"]}
      />
    </div>
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
