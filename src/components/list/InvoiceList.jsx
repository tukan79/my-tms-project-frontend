// src/components/list/InvoiceList.jsx
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import DataTable from '@/components/shared/DataTable.jsx';
import {
  FileText,
  Calendar,
  User,
  PoundSterling,
  Download,
} from 'lucide-react';

import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';

// Sonar-safe access to URL API
const getUrlApi = () =>
  typeof globalThis !== 'undefined' ? globalThis.URL : null;

const InvoiceList = ({ invoices, onRefresh }) => {
  const { showToast } = useToast();

  const safeInvoices = useMemo(
    () => (Array.isArray(invoices) ? invoices : []),
    [invoices]
  );

  const columns = useMemo(
    () => [
      {
        key: 'invoice_number',
        header: 'Invoice #',
        icon: <FileText size={16} />,
        sortable: true,
      },
      {
        key: 'customer_name',
        header: 'Customer',
        icon: <User size={16} />,
        sortable: true,
      },
      {
        key: 'issue_date',
        header: 'Issue Date',
        icon: <Calendar size={16} />,
        sortable: true,
        render: (item) => {
          const date = item?.issue_date
            ? new Date(item.issue_date)
            : null;
          return date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString()
            : 'N/A';
        },
      },
      {
        key: 'due_date',
        header: 'Due Date',
        sortable: true,
        render: (item) => {
          const date = item?.due_date
            ? new Date(item.due_date)
            : null;
          return date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString()
            : 'N/A';
        },
      },
      {
        key: 'total_amount',
        header: 'Amount',
        icon: <PoundSterling size={16} />,
        sortable: true,
        render: (item) => {
          const value = Number(item?.total_amount ?? 0);
          return `£${value.toFixed(2)}`;
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (item) => {
          const status = item?.status ?? 'unknown';
          return (
            <span className={`status status-${status}`}>
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleDownloadPDF = useCallback(
    async (invoiceId) => {
      if (!invoiceId) {
        showToast('Invalid invoice ID.', 'error');
        return;
      }

      try {
        const response = await api.get(
          `/api/invoices/${invoiceId}/pdf`,
          { responseType: 'blob' }
        );

        const urlApi = getUrlApi();

        if (!urlApi) {
          showToast('Download not supported in this environment.', 'error');
          return;
        }

        const blob = new Blob([response.data]);
        const url = urlApi.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${invoiceId}.pdf`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        urlApi.revokeObjectURL(url);

        showToast('Invoice PDF downloaded successfully.', 'success');
      } catch (error) {
        showToast('Failed to download invoice PDF.', 'error');
      }
    },
    [showToast]
  );

  const customActions = useMemo(
    () => [
      {
        icon: <Download size={16} />,
        onClick: (item) => handleDownloadPDF(item?.id),
        title: 'Download PDF',
      },
    ],
    [handleDownloadPDF]
  );

  return (
    <DataTable
      items={safeInvoices}
      columns={columns}
      onRefresh={onRefresh}
      title="Generated Invoices"
      filterPlaceholder="Filter invoices..."
      filterKeys={['invoice_number', 'customer_name', 'status']}
      initialSortKey="issue_date"
      customActions={customActions}
    />
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
