// src/components/list/ZoneList.jsx
import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";

import DataTable from "@/components/shared/DataTable.jsx";
import api from "@/services/api.js";
import { useToast } from "@/contexts/ToastContext.jsx";

import { MapPin, Hash } from "lucide-react";

/* Safe confirm without window.* */
const confirmAction = (message) => {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.confirm === "function"
  ) {
    return globalThis.confirm(message);
  }
  return false;
};

const ZoneList = ({ items, onRefresh, onEdit }) => {
  const { showToast } = useToast();

  const safeZones = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  const [expanded, setExpanded] = useState({});

  const toggleExpand = useCallback((zoneId) => {
    setExpanded((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
  }, []);

  /* ---------------------------------------------------------
      RENDER POSTCODE PATTERNS
  --------------------------------------------------------- */
  const renderPostcodePatterns = (zone) => {
    const patterns = Array.isArray(zone.postcode_patterns)
      ? zone.postcode_patterns
      : [];

    if (patterns.length === 0) {
      return <span className="text-muted">No postcodes</span>;
    }

    const isOpen = expanded[zone.id];
    const toShow = isOpen ? patterns : patterns.slice(0, 6);

    return (
      <div className="tag-container">
        {toShow.map((p) => (
          <span key={p} className="tag">
            <Hash size={12} /> {p}
          </span>
        ))}

        {patterns.length > 6 && (
          <button
            type="button"
            className="btn-link"
            style={{ fontSize: "0.8rem", paddingLeft: "0.2rem" }}
            onClick={() => toggleExpand(zone.id)}
          >
            {isOpen
              ? "Show less ▲"
              : `+${patterns.length - 6} more ▼`}
          </button>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------
      TABLE COLUMNS (MODERN)
  --------------------------------------------------------- */
  const columns = [
    {
      key: "zone_name",
      header: (
        <div className="table-col-header">
          <MapPin size={14} /> Zone
        </div>
      ),
      sortable: true,
    },
    {
      key: "postcode_patterns",
      header: (
        <div className="table-col-header">
          <Hash size={14} /> Postcode Patterns
        </div>
      ),
      sortable: false,
      render: (zone) => renderPostcodePatterns(zone),
    },
    {
      key: "is_home_zone",
      header: "Home Zone",
      sortable: true,
      render: (zone) =>
        zone.is_home_zone ? (
          <span className="status status-active">Yes</span>
        ) : (
          <span className="status status-inactive">No</span>
        ),
    },
  ];

  /* ---------------------------------------------------------
      DELETE HANDLER
  --------------------------------------------------------- */
  const handleDelete = async (zone) => {
    if (zone.is_home_zone) {
      showToast("You cannot delete the home zone.", "error");
      return;
    }

    const ok = confirmAction(
      `Delete zone "${zone.zone_name}"?`
    );
    if (!ok) return;

    try {
      await api.delete(`/api/zones/${zone.id}`);
      showToast("Zone deleted.", "success");
      onRefresh?.();
    } catch (error) {
      showToast(
        error?.response?.data?.error ||
          "Failed to delete zone.",
        "error"
      );
    }
  };

  /* ---------------------------------------------------------
      RENDER
  --------------------------------------------------------- */
  return (
    <div className="card">
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Postcode Zones</h2>
          <p className="text-muted small">
            {safeZones.length} zones configured
          </p>
        </div>
      </div>

      <DataTable
        items={safeZones}
        columns={columns}
        onEdit={onEdit}
        onDelete={handleDelete}
        onRefresh={onRefresh}
        title="Zones"
        filterPlaceholder="Search zones..."
        initialSortKey="zone_name"
        filterKeys={["zone_name", "postcode_patterns"]}
      />
    </div>
  );
};

ZoneList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
};

ZoneList.defaultProps = {
  items: [],
  onRefresh: undefined,
  onEdit: undefined,
};

export default ZoneList;
