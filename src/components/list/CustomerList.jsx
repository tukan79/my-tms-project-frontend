import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";

import DataTable from "@/components/shared/DataTable.jsx";
import api from "@/services/api.js";
import { useToast } from "@/contexts/ToastContext.jsx";
import { Plus } from "lucide-react";

/* Safe confirm helper */
const confirmAction = (message) => {
  if (typeof globalThis !== "undefined" && typeof globalThis.confirm === "function") {
    return globalThis.confirm(message);
  }
  return false;
};

const CustomerList = ({ items, onRefresh, onEdit, onAdd }) => {
  const { showToast } = useToast();

  const customers = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const getVal = useCallback((item, keys) => {
    for (const key of keys) {
      const v = item?.[key];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  }, []);

  /* -------------------------------
        TABLE COLUMNS — MODERNIZED
  -------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: "customerCode",
        header: "Code",
        sortable: true,
        render: (item) => getVal(item, ["customer_code", "customerCode"]) || "—",
      },
      { key: "name", header: "Name", sortable: true },
      {
        key: "postcode",
        header: "Postcode",
        render: (item) => getVal(item, ["postcode"]),
      },
      {
        key: "phoneNumber",
        header: "Phone",
        render: (item) => getVal(item, ["phone_number", "phoneNumber"]),
      },

      {
        key: "status",
        header: "Status",
        render: (item) => {
          const statusValue = getVal(item, ["status"]);
          const statusClass = {
            active: "status-active",
            inactive: "status-inactive",
          }[statusValue] || "status-unknown";

          return (
            <span className={`status ${statusClass}`}>
              {statusValue || "Unknown"}
            </span>
          );
        },
      },

      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (item) => {
          const created = getVal(item, ["created_at", "createdAt"]);
          return created ? new Date(created).toLocaleDateString() : "—";
        },
      },
    ],
    [getVal]
  );

  /* -------------------------------
        DELETE HANDLER
  -------------------------------- */
  const handleDelete = useCallback(
    async (customer) => {
      if (!customer?.id) {
        showToast("Invalid customer record.", "error");
        return;
      }

      const confirmed = confirmAction(
        `Delete customer "${customer.name}"?\nThis action cannot be undone.`
      );
      if (!confirmed) return;

      try {
        await api.delete(`/api/customers/${customer.id}`);
        showToast("Customer deleted.", "success");
        onRefresh?.();
      } catch (err) {
        showToast(err?.response?.data?.error || "Failed to delete customer.", "error");
      }
    },
    [onRefresh, showToast]
  );

  /* -------------------------------
        RENDER
  -------------------------------- */
  return (
    <div className="card">
      {/* MODERN HEADER */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Customers</h2>
          <p className="text-muted small">{customers.length} total customers</p>
        </div>

        {onAdd && (
          <button type="button" className="btn-primary" onClick={onAdd}>
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {/* TABLE */}
      <DataTable
        items={customers}
        columns={columns}
        onEdit={onEdit}
        onDelete={handleDelete}
        filterPlaceholder="Search customers…"
        initialSortKey="name"
        filterKeys={[
          "name",
          "customer_code",
          "customerCode",
          "postcode",
          "phone_number",
          "phoneNumber",
        ]}
      />
    </div>
  );
};

CustomerList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
  onAdd: PropTypes.func,
};

CustomerList.defaultProps = {
  items: [],
  onRefresh: undefined,
  onEdit: undefined,
  onAdd: undefined,
};

export default CustomerList;
