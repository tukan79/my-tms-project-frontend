// src/components/list/TruckList.jsx
import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

import api from "@/services/api.js";
import DataTable from "@/components/shared/DataTable.jsx";
import { useToast } from "@/contexts/ToastContext.jsx";

import { Truck, Hash, Weight, Layers, Ruler, Calendar } from "lucide-react";

/* Safe confirm helper */
const confirmAction = (message) => {
  if (typeof globalThis !== "undefined" && globalThis.confirm) {
    return globalThis.confirm(message);
  }
  return false;
};

const TruckList = ({ items, onRefresh, onEdit }) => {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const safeTrucks = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  /* Normalize snake/camel casing */
  const norm = (item, ...keys) => {
    for (const k of keys) {
      if (item[k] !== undefined) return item[k];
    }
    return null;
  };

  /* ---------------------------------------------------
        TABLE COLUMNS — Modern SaaS Look
  --------------------------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: "registration_plate",
        header: (
          <div className="table-col-header">
            <Truck size={14} /> Registration
          </div>
        ),
        sortable: true,
        render: (t) => norm(t, "registration_plate", "registrationPlate") || "—",
      },

      {
        key: "brand",
        header: (
          <div className="table-col-header">
            <Hash size={14} /> Brand
          </div>
        ),
        sortable: true,
        render: (t) => t.brand ?? "—",
      },

      {
        key: "model",
        header: (
          <div className="table-col-header">
            <Hash size={14} /> Model
          </div>
        ),
        sortable: true,
        render: (t) => t.model ?? "—",
      },

      {
        key: "vin",
        header: (
          <div className="table-col-header">
            <Hash size={14} /> VIN
          </div>
        ),
        sortable: true,
        render: (t) => t.vin ?? "—",
      },

      {
        key: "production_year",
        header: (
          <div className="table-col-header">
            <Calendar size={14} /> Year
          </div>
        ),
        sortable: true,
        render: (t) => norm(t, "production_year", "productionYear") || "—",
      },

      {
        key: "type_of_truck",
        header: "Vehicle Type",
        sortable: true,
        render: (t) => {
          const type = (norm(t, "type_of_truck", "typeOfTruck") || "unknown").toLowerCase();

          return (
            <span className={`status status-${type}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          );
        },
      },

      /* Extra details for rigid trucks */
      {
        key: "total_weight",
        header: (
          <div className="table-col-header">
            <Weight size={14} /> Total Weight (kg)
          </div>
        ),
        sortable: true,
        render: (t) => {
          const type = norm(t, "type_of_truck", "typeOfTruck");
          const v = norm(t, "total_weight", "totalWeight");
          return type === "rigid" && v ? `${v} kg` : "—";
        },
      },

      {
        key: "pallet_capacity",
        header: (
          <div className="table-col-header">
            <Layers size={14} /> Pallet Capacity
          </div>
        ),
        sortable: true,
        render: (t) => {
          const type = norm(t, "type_of_truck", "typeOfTruck");
          const v = norm(t, "pallet_capacity", "palletCapacity");
          return type === "rigid" && v ? v : "—";
        },
      },

      {
        key: "max_payload_kg",
        header: (
          <div className="table-col-header">
            <Weight size={14} /> Payload (kg)
          </div>
        ),
        sortable: true,
        render: (t) => {
          const type = norm(t, "type_of_truck", "typeOfTruck");
          const v = norm(t, "max_payload_kg", "maxPayloadKg");
          return type === "rigid" && v ? `${v} kg` : "—";
        },
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
    ],
    []
  );

  /* ---------------------------------------------------
        DELETE HANDLER
  --------------------------------------------------- */
  const handleDelete = useCallback(
    async (truck) => {
      if (!truck?.id) {
        showToast("Invalid truck record.", "error");
        return;
      }

      const plate = norm(truck, "registration_plate", "registrationPlate");
      const ok = confirmAction(`Delete vehicle "${plate}"?`);
      if (!ok) return;

      setIsDeleting(true);

      try {
        await api.delete(`/api/trucks/${truck.id}`);
        showToast("Vehicle deleted successfully.", "success");
        onRefresh();
      } catch (error) {
        showToast(error?.response?.data?.error || "Failed to delete vehicle.", "error");
      } finally {
        setIsDeleting(false);
      }
    },
    [onRefresh, showToast]
  );

  const safeDeleteHandler = isDeleting ? () => {} : handleDelete;

  /* ---------------------------------------------------
        RENDER
  --------------------------------------------------- */
  return (
    <div className="card">
      {/* Modern SaaS Header */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Trucks</h2>
          <p className="text-muted small">{safeTrucks.length} vehicles</p>
        </div>
      </div>

      <DataTable
        items={safeTrucks}
        columns={columns}
        onRefresh={onRefresh}
        onEdit={onEdit}
        onDelete={safeDeleteHandler}
        title="Truck List"
        filterPlaceholder="Search vehicles..."
        initialSortKey="registration_plate"
        filterKeys={[
          "registration_plate",
          "registrationPlate",
          "brand",
          "model",
          "vin",
          "type_of_truck",
          "typeOfTruck",
          "production_year",
          "productionYear",
        ]}
      />
    </div>
  );
};

TruckList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

TruckList.defaultProps = {
  items: [],
};

export default TruckList;
