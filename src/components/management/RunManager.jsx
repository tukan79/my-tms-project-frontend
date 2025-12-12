// src/components/list/RunManager.jsx
import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Plus, Calendar, Truck, User } from "lucide-react";

import AddRunForm from "@/components/forms/AddRunForm.jsx";
import DataTable from "@/components/shared/DataTable.jsx";
import { useToast } from "@/contexts/ToastContext.jsx";

/* Safe confirm helper */
const confirmAction = (message) => {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.confirm === "function"
  ) {
    return globalThis.confirm(message);
  }
  return false;
};

const RunManager = ({
  runs = [],
  trucks = [],
  trailers = [],
  drivers = [],
  runActions,
}) => {
  const { showToast } = useToast();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRun, setEditingRun] = useState(null);

  /* ------------------------------------------------------------
      SAFETY NORMALIZATION
  ------------------------------------------------------------ */
  const safeRuns = Array.isArray(runs) ? runs : [];
  const safeTrucks = Array.isArray(trucks) ? trucks : [];
  const safeTrailers = Array.isArray(trailers) ? trailers : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];

  /* ------------------------------------------------------------
      FORM OPEN/CLOSE HANDLERS
  ------------------------------------------------------------ */
  const openCreateForm = useCallback(() => {
    setEditingRun(null);
    setIsFormVisible(true);
  }, []);

  const openEditForm = useCallback((run) => {
    setEditingRun(run);
    setIsFormVisible(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormVisible(false);
    setEditingRun(null);
  }, []);

  /* ------------------------------------------------------------
      SAVE RUN (CREATE OR UPDATE)
  ------------------------------------------------------------ */
  const handleSaveRun = useCallback(
    async (data) => {
      try {
        if (editingRun) {
          await runActions.update(editingRun.id, data);
        } else {
          await runActions.create(data);
        }

        showToast("Run saved successfully!", "success");
        closeForm();
      } catch (err) {
        showToast(
          err?.response?.data?.error || "Failed to save run.",
          "error"
        );
      }
    },
    [editingRun, runActions, showToast, closeForm]
  );

  /* ------------------------------------------------------------
      FAST LOOKUP MAPS
  ------------------------------------------------------------ */
  const driverMap = useMemo(
    () =>
      new Map(
        safeDrivers.map((d) => [d.id, `${d.first_name} ${d.last_name}`])
      ),
    [safeDrivers]
  );

  const truckMap = useMemo(
    () => new Map(safeTrucks.map((t) => [t.id, t.registration_plate])),
    [safeTrucks]
  );

  const trailerMap = useMemo(
    () =>
      new Map(
        safeTrailers.map((t) => [t.id, t.registration_plate])
      ),
    [safeTrailers]
  );

  /* ------------------------------------------------------------
      ENRICH RUNS FOR THE TABLE
  ------------------------------------------------------------ */
  const enrichedRuns = useMemo(
    () =>
      safeRuns.map((run) => ({
        ...run,
        driverName: driverMap.get(run.driver_id) || "N/A",
        truckPlate: truckMap.get(run.truck_id) || "N/A",
        trailerPlate: run.trailer_id
          ? trailerMap.get(run.trailer_id) || "N/A"
          : "N/A",
      })),
    [safeRuns, driverMap, truckMap, trailerMap]
  );

  /* ------------------------------------------------------------
      TABLE COLUMNS
  ------------------------------------------------------------ */
  const columns = [
    {
      key: "run_date",
      header: (
        <div className="table-col-header">
          <Calendar size={14} /> Date
        </div>
      ),
      sortable: true,
      render: (item) => new Date(item.run_date).toLocaleDateString(),
    },
    {
      key: "driverName",
      header: (
        <div className="table-col-header">
          <User size={14} /> Driver
        </div>
      ),
      sortable: true,
    },
    {
      key: "truckPlate",
      header: (
        <div className="table-col-header">
          <Truck size={14} /> Truck
        </div>
      ),
      sortable: true,
    },
    {
      key: "trailerPlate",
      header: (
        <div className="table-col-header">
          <Truck size={14} /> Trailer
        </div>
      ),
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (item) => (
        <span style={{ textTransform: "capitalize" }}>{item.type}</span>
      ),
    },
  ];

  /* ------------------------------------------------------------
      DELETE RUN
  ------------------------------------------------------------ */
  const handleDeleteRun = useCallback(
    async (run) => {
      const enriched = enrichedRuns.find((r) => r.id === run.id);

      const driver = enriched?.driverName || "N/A";
      const date = new Date(run.run_date).toLocaleDateString();

      const ok = confirmAction(
        `Delete run for ${driver} on ${date}?`
      );
      if (!ok) return;

      try {
        await runActions.delete(run.id);
        showToast("Run deleted successfully.", "success");
      } catch (err) {
        showToast(
          err?.response?.data?.error || "Failed to delete run.",
          "error"
        );
      }
    },
    [enrichedRuns, runActions, showToast]
  );

  /* ------------------------------------------------------------
      RENDER
  ------------------------------------------------------------ */
  return (
    <div className="card">
      {/* ---------- ADD / EDIT FORM MODAL ---------- */}
      {isFormVisible && (
        <div className="modal-overlay">
          <AddRunForm
            onSuccess={handleSaveRun}
            onCancel={closeForm}
            itemToEdit={editingRun}
            drivers={safeDrivers}
            trucks={safeTrucks}
            trailers={safeTrailers}
          />
        </div>
      )}

      {/* ---------- HEADER ---------- */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Run Management</h2>
          <p className="text-muted small">
            {enrichedRuns.length} configured runs
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openCreateForm}
        >
          <Plus size={16} /> Add Run
        </button>
      </div>

      {/* ---------- DATA TABLE ---------- */}
      <DataTable
        items={enrichedRuns}
        columns={columns}
        onEdit={openEditForm}
        onDelete={handleDeleteRun}
        filterPlaceholder="Search runs..."
        filterKeys={[
          "run_date",
          "driverName",
          "truckPlate",
          "trailerPlate",
          "type",
        ]}
        initialSortKey="run_date"
        initialSortOrder="desc"
      />
    </div>
  );
};

RunManager.propTypes = {
  runs: PropTypes.arrayOf(PropTypes.object),
  trucks: PropTypes.arrayOf(PropTypes.object),
  trailers: PropTypes.arrayOf(PropTypes.object),
  drivers: PropTypes.arrayOf(PropTypes.object),
  runActions: PropTypes.shape({
    create: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    delete: PropTypes.func.isRequired,
  }).isRequired,
};

export default RunManager;
