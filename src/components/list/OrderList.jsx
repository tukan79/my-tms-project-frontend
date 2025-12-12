// src/components/list/OrderList.jsx
import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

import DataTable from "@/components/shared/DataTable.jsx";
import {
  Package,
  PoundSterling,
  Calendar,
  Truck,
  Printer,
} from "lucide-react";

import api from "@/services/api.js";
import { useToast } from "@/contexts/ToastContext.jsx";
import { isPostcodeInZone } from "@/utils/postcode.js";

/* Safe confirm helper */
const confirmAction = (message) => {
  if (typeof globalThis !== "undefined" && globalThis.confirm) {
    return globalThis.confirm(message);
  }
  return false;
};

const OrderList = ({ items, zones, onRefresh, onEdit }) => {
  const { showToast } = useToast();

  const safeOrders = Array.isArray(items) ? items : [];
  const safeZones = Array.isArray(zones) ? zones : [];

  /* ------------------------------
      UI STATE
  ------------------------------ */
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "—";
    }
  };

  const getDateField = (order) => {
    if (activeTab === "collections") return order.loading_date_time;
    if (activeTab === "delivery") return order.unloading_date_time;
    return order.created_at;
  };

  /* ------------------------------
      COLUMNS — Modern SaaS
  ------------------------------ */
  const columns = [
    {
      key: "order_number",
      header: (
        <div className="table-col-header">
          <Package size={14} /> Consignment #
        </div>
      ),
      sortable: true,
    },
    {
      key: "customer_reference",
      header: "Customer Ref",
      sortable: true,
      render: (order) => order.customer_reference || "—",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (order) => (
        <span className={`status status-${order.status || "unknown"}`}>
          {order.status || "unknown"}
        </span>
      ),
    },

    /* ---------------- Timeline Column ---------------- */
    {
      key: "timeline",
      header: (
        <div className="table-col-header">
          <Truck size={14} /> Timeline
        </div>
      ),
      render: (order) => {
        const load = order.sender_details ?? {};
        const unload = order.recipient_details ?? {};

        return (
          <div className="timeline-wrapper">
            {/* Loading */}
            <div className="timeline-item">
              <div className="timeline-dot loading"></div>
              <div className="timeline-content">
                <strong>Loading</strong>
                <div className="text-muted small">
                  {load.name || "—"}, {load.townCity || "—"}
                </div>
                <div className="timeline-date">
                  {formatDateTime(order.loading_date_time)}
                </div>
              </div>
            </div>

            <div className="timeline-line"></div>

            {/* Unloading */}
            <div className="timeline-item">
              <div className="timeline-dot unloading"></div>
              <div className="timeline-content">
                <strong>Unloading</strong>
                <div className="text-muted small">
                  {unload.name || "—"}, {unload.townCity || "—"}
                </div>
                <div className="timeline-date">
                  {formatDateTime(order.unloading_date_time)}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },

    {
      key: "final_price",
      header: (
        <div className="table-col-header">
          <PoundSterling size={14} /> Price
        </div>
      ),
      render: (item) =>
        item.final_price ? `£${Number(item.final_price).toFixed(2)}` : "—",
    },

    {
      key: "created_at",
      header: (
        <div className="table-col-header">
          <Calendar size={14} /> Created
        </div>
      ),
      sortable: true,
      render: (item) =>
        item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : "—",
    },
  ];

  /* ------------------------------
      PRINT LABELS
  ------------------------------ */
  const handlePrintLabels = async (order) => {
    try {
      const response = await api.get(`/api/orders/${order.id}/labels`, {
        responseType: "blob",
      });

      const blobUrl = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `labels_order_${order.id}.pdf`;
      link.click();

      URL.revokeObjectURL(blobUrl);
      showToast("Labels downloaded successfully.", "success");
    } catch {
      showToast("Failed to generate labels.", "error");
    }
  };

  /* ------------------------------
      DELETE ORDER
  ------------------------------ */
  const handleDelete = async (order) => {
    const ok = confirmAction(
      `Delete order ${order.customer_reference || order.id}?`
    );
    if (!ok) return;

    try {
      await api.delete(`/api/orders/${order.id}`);
      showToast("Order deleted successfully.", "success");
      onRefresh();
    } catch (error) {
      showToast(
        error?.response?.data?.error || "Failed to delete order.",
        "error"
      );
    }
  };

  /* ------------------------------
      FILTERS
  ------------------------------ */
  const filteredOrders = useMemo(() => {
    let out = [...safeOrders];
    const homeZone = safeZones.find((z) => z.is_home_zone);

    if (activeTab === "delivery" && homeZone) {
      out = out.filter((o) =>
        isPostcodeInZone(o.recipient_details?.postCode, homeZone)
      );
    }

    if (activeTab === "collections" && homeZone) {
      out = out.filter((o) =>
        isPostcodeInZone(o.sender_details?.postCode, homeZone)
      );
    }

    const { start, end } = dateRange;

    if (start && end) {
      out = out.filter((order) => {
        const dateField = getDateField(order);
        if (!dateField) return false;

        try {
          const d = new Date(dateField).toISOString().split("T")[0];
          return d >= start && d <= end;
        } catch {
          return false;
        }
      });
    }

    return out;
  }, [safeOrders, safeZones, activeTab, dateRange]);

  /* ------------------------------
      RENDER
  ------------------------------ */
  return (
    <div className="card order-list-card">

      {/* Modern SaaS Header */}
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Orders</h2>
          <p className="text-muted small">{filteredOrders.length} orders</p>
        </div>

        <div className="order-list-controls">
          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              className={`tab-button ${activeTab === "delivery" ? "active" : ""}`}
              onClick={() => setActiveTab("delivery")}
            >
              Delivery
            </button>
            <button
              className={`tab-button ${activeTab === "collections" ? "active" : ""}`}
              onClick={() => setActiveTab("collections")}
            >
              Collections
            </button>
          </div>

          {/* Date range */}
          <div className="range-group">
            <div className="form-group compact">
              <label>From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, start: e.target.value }))
                }
              />
            </div>

            <div className="form-group compact">
              <label>To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, end: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        items={filteredOrders}
        columns={columns}
        onRefresh={onRefresh}
        onEdit={onEdit}
        onDelete={handleDelete}
        customActions={[
          {
            icon: <Printer size={16} />,
            onClick: handlePrintLabels,
            title: "Print Pallet Labels",
          },
        ]}
        title="Order List"
        filterPlaceholder="Filter orders..."
        initialSortKey="created_at"
        filterKeys={[
          "order_number",
          "customer_reference",
          "status",
          "sender_details.townCity",
          "recipient_details.townCity",
          "sender_details.name",
          "recipient_details.name",
        ]}
      />
    </div>
  );
};

OrderList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  zones: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

OrderList.defaultProps = {
  items: [],
  zones: [],
};

export default OrderList;
