// src/components/list/TrailerList.jsx
import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

import api from "@/services/api.js";
import DataTable from "@/components/shared/DataTable.jsx";
import { useToast } from "@/contexts/ToastContext.jsx";

import { Truck, Weight, Ruler, Layers } from "lucide-react";

/* Safe confirm helper */
const confirmAction = (message) => {
  if (typeof globalThis !== "undefined" && typeof globalThis.confirm === "function") {
    return globalThis.confirm(message);
  }
  return false;
};

const TrailerList = ({ items, onRefresh, onEdit }) => {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const safeTrailers = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  /* -----------------------------------
      TABLE COLUMNS — Modern SaaS
  ----------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: "registrationPlate",
        header: (
          <div className="table-col-header">
            <Truck size={14} /> Trailer Code
          </div>
        ),
        sortable: true,
      },
      {
        key: "description",
        header: "Description",
        sortable: true,
        render: (t) => t.description || "—",
      },
      {
        key: "category",
        header: "Category",
        sortable: true,
        render: (t) => t.category || "—",
      },
      {
        key: "maxPayloadKg",
        header: (
          <div className="table-col-header">
            <Weight size={14} /> Payload (kg)
          </div>
        ),
        sortable: true,
        render: (t) => t.maxPayloadKg ?? "—",
      },
      {
        key: "maxSpaces",
        header: (
          <div className="table-col-header">
            <Layers size={14} /> Spaces
          </div>
        ),
        sortable: true,
        render: (t) => t.maxSpaces ?? "—",
      },
      {
        key: "lengthM",
        header: (
          <div className="table-col-header">
            <Ruler size={14} /> Length (m)
          </div>
        ),
        sortable: true,
        render: (t) => t.lengthM ?? "—",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (item) => {
          const status = (item?.status || "unknown").toLowerCase();
          return (
            <span className={`status status-${status}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
    ],
    []
  );

  /* -----------------------------------
      DELETE HANDLER
  ----------------------------------- */
  const handleDelete = useCallback(
    async (trailer) => {
      if (!trailer?.id) {
        showToast("Invalid trailer record.", "error");
        return;
      }

      const ok = confirmAction(
        `Are you sure you want to delete trailer "${trailer.registrationPlate}"?`
      );
      if (!ok) return;

      setIsDeleting(true);

      try {
        await api.delete(`/api/trailers/${trailer.id}`);
        showToast("Trailer deleted successfully.", "success");
        onRefresh();
      } catch (error) {
        showToast(
          error?.response?.data?.error || "Failed to delete trailer.",
          "error"
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [onRefresh, showToast]
  );

  const safeDeleteHandler = isDeleting ? () => {} : handleDelete;

  /* -----------------------------------
            RENDER
  ----------------------------------- */
  return (
    <div className="card">
      {/* Modern SaaS Header */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Trailers</h2>
          <p className="text-muted small">
            {safeTrailers.length} trailers registered
          </p>
        </div>
      </div>

      <DataTable
        items={safeTrailers}
        columns={columns}
        onRefresh={onRefresh}
        onEdit={onEdit}
        onDelete={safeDeleteHandler}
        title="Trailers"
        filterPlaceholder="Search trailers…"
        initialSortKey="registrationPlate"
        filterKeys={[
          "registrationPlate",
          "description",
          "category",
          "status",
        ]}
      />
    </div>
  );
};

TrailerList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

TrailerList.defaultProps = {
  items: [],
};

export default TrailerList;
