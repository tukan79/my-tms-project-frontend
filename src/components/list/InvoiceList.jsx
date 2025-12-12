import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";

import DataTable from "@/components/shared/DataTable.jsx";
import {
  FileText,
  Calendar,
  User,
  PoundSterling,
  Download,
} from "lucide-react";

import api from "@/services/api.js";
import { useToast } from "@/contexts/ToastContext.jsx";

/* Safe URL API helper */
const getUrlApi = () =>
  typeof globalThis === "undefined" ? null : globalThis.URL;

const InvoiceList = ({ invoices, onRefresh }) => {
  const { showToast } = useToast();

  const safeInvoices = useMemo(
    () => (Array.isArray(invoices) ? invoices : []),
    [invoices]
  );

  /* ---------------------------------------
        STATUS STYLE MAP
  ---------------------------------------- */
  const statusClass = (statusRaw) => {
    const status = (statusRaw || "unknown").toLowerCase();

    switch (status) {
      case "paid":
        return "status-paid";
      case "overdue":
        return "status-overdue";
      case "pending":
        return "status-pending";
      default:
        return "status-unknown";
    }
  };

  /* ---------------------------------------
        TABLE COLUMNS – Modern UI
  ---------------------------------------- */
  const columns = useMemo(
    () => [
      {
        key: "invoice_number",
        header: (
          <div className="table-col-header">
            <FileText size={14} /> Invoice #
          </div>
        ),
        sortable: true,
      },
      {
        key: "customer_name",
        header: (
          <div className="table-col-header">
            <User size={14} /> Customer
          </div>
        ),
        sortable: true,
      },
      {
        key: "issue_date",
        header: (
          <div className="table-col-header">
            <Calendar size={14} /> Issued
          </div>
        ),
        sortable: true,
        render: (item) => {
          const d = item?.issue_date ? new Date(item.issue_date) : null;
          return d && !isNaN(d) ? d.toLocaleDateString() : "—";
        },
      },
      {
        key: "due_date",
        header: (
          <div className="table-col-header">
            <Calendar size={14} /> Due
          </div>
        ),
        sortable: true,
        render: (item) => {
          const d = item?.due_date ? new Date(item.due_date) : null;
          return d && !isNaN(d) ? d.toLocaleDateString() : "—";
        },
      },
      {
        key: "total_amount",
        header: (
          <div className="table-col-header">
            <PoundSterling size={14} /> Amount
          </div>
        ),
        sortable: true,
        render: (item) => `£${Number(item?.total_amount ?? 0).toFixed(2)}`,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (item) => (
          <span className={`status ${statusClass(item?.status)}`}>
            {(item?.status || "unknown").toUpperCase()}
          </span>
        ),
      },
    ],
    []
  );

  /* ---------------------------------------
         DOWNLOAD PDF
  ---------------------------------------- */
  const handleDownloadPDF = useCallback(
    async (invoiceId) => {
      if (!invoiceId) {
        showToast("Invalid invoice ID.", "error");
        return;
      }

      try {
        const response = await api.get(`/api/invoices/${invoiceId}/pdf`, {
          responseType: "blob",
        });

        const urlApi = getUrlApi();
        if (!urlApi) {
          showToast("Download not supported in this environment.", "error");
          return;
        }

        const blob = new Blob([response.data]);
        const url = urlApi.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice_${invoiceId}.pdf`;
        link.click();

        urlApi.revokeObjectURL(url);
        showToast("Invoice PDF downloaded.", "success");
      } catch (err) {
        console.error("Invoice PDF download failed:", err);
        showToast("Failed to download invoice PDF.", "error");
      }
    },
    [showToast]
  );

  /* ---------------------------------------
         CUSTOM ACTIONS
  ---------------------------------------- */
  const customActions = useMemo(
    () => [
      {
        icon: <Download size={16} />,
        title: "Download PDF",
        onClick: (item) => handleDownloadPDF(item?.id),
      },
    ],
    [handleDownloadPDF]
  );

  /* ---------------------------------------
            RENDER
  ---------------------------------------- */
  return (
    <div className="card">
      <div className="card-header-modern">
        <div>
          <h2 className="card-title">Invoices</h2>
          <p className="text-muted small">
            {safeInvoices.length} generated invoices
          </p>
        </div>
      </div>

      <DataTable
        items={safeInvoices}
        columns={columns}
        customActions={customActions}
        onRefresh={onRefresh}
        title="Invoices"
        filterPlaceholder="Search invoices…"
        filterKeys={["invoice_number", "customer_name", "status"]}
        initialSortKey="issue_date"
        initialSortOrder="desc"
      />
    </div>
  );
};

InvoiceList.propTypes = {
  invoices: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
};

InvoiceList.defaultProps = {
  invoices: [],
  onRefresh: undefined,
};

export default InvoiceList;

/* ---------------------------------------
      Modern SaaS Header Styles
---------------------------------------- */
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1.4rem",
  },
  title: {
    margin: 0,
    fontWeight: 700,
    fontSize: "1.4rem",
    color: "var(--primary)",
  },
  subtitle: {
    color: "var(--text-light)",
    marginTop: "0.25rem",
    fontSize: "0.85rem",
  },
};
