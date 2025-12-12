import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";

import api from "@/services/api.js";
import DataTable from "@/components/shared/DataTable.jsx";
import { useToast } from "@/contexts/ToastContext.jsx";
import { Plus } from "lucide-react";

/* Safe confirm helper */
const confirmAction = (message) => {
  if (typeof globalThis !== "undefined" && typeof globalThis.confirm === "function") {
    return globalThis.confirm(message);
  }
  return false;
};

const DriverList = ({ items, onRefresh, onEdit, onAdd }) => {
  const { showToast } = useToast();

  const drivers = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  /* --------------------------------
      TABLE COLUMNS – Modernized
  --------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (driver) =>
          `${driver?.first_name ?? ""} ${driver?.last_name ?? ""}`.trim(),
      },

      {
        key: "license_number",
        header: "License No.",
        sortable: true,
      },

      {
        key: "phone_number",
        header: "Phone",
        sortable: true,
      },

      {
        key: "cpc_number",
        header: "CPC",
        sortable: true,
        render: (d) => d?.cpc_number || "N/A",
      },

      {
        key: "login_code",
        header: "Login Code",
        sortable: true,
        render: (d) => d?.login_code || "—",
      },

      {
        key: "is_active",
        header: "Status",
        sortable: true,
        render: (d) => {
          const active = Boolean(d.is_active);
          return (
            <span className={`status ${active ? "status-active" : "status-inactive"}`}>
              {active ? "Active" : "Inactive"}
            </span>
          );
        },
      },
    ],
    []
  );

  /* --------------------------------
      DELETE HANDLER
  --------------------------------- */
  const handleDelete = useCallback(
    async (driver) => {
      if (!driver?.id) {
        showToast("Invalid driver record.", "error");
        return;
      }

      const confirmMsg = `Delete driver ${driver.first_name} ${driver.last_name}?`;
      if (!confirmAction(confirmMsg)) return;

      try {
        await api.delete(`/api/drivers/${driver.id}`);
        showToast("Driver deleted.", "success");
        onRefresh?.();
      } catch (err) {
        showToast(err?.response?.data?.error || "Failed to delete driver.", "error");
      }
    },
    [onRefresh, showToast]
  );

  /* --------------------------------
      RENDER
  --------------------------------- */
  return (
    <div className="card">
      {/* MODERN SAAS HEADER */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Drivers</h2>
          <p className="text-muted small">{drivers.length} total drivers</p>
        </div>

        {onAdd && (
          <button type="button" className="btn-primary" onClick={onAdd}>
            <Plus size={16} /> Add Driver
          </button>
        )}
      </div>

      {/* TABLE */}
      <DataTable
        items={drivers}
        columns={columns}
        onRefresh={onRefresh}
        onEdit={onEdit}
        onDelete={handleDelete}
        initialSortKey="first_name"
        filterPlaceholder="Search drivers…"
        filterKeys={[
          "first_name",
          "last_name",
          "license_number",
          "phone_number",
          "cpc_number",
          "login_code",
        ]}
      />
    </div>
  );
};

DriverList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
  onAdd: PropTypes.func,
};

DriverList.defaultProps = {
  items: [],
  onRefresh: undefined,
  onEdit: undefined,
  onAdd: undefined,
};

export default DriverList;
