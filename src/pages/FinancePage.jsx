import { useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import DataTable from '@/components/shared/DataTable.jsx';
import { Package, PoundSterling, Download, FileText } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext.jsx';
import InvoiceList from '@/components/list/InvoiceList.jsx';

const FinancePage = ({
  orders = [],
  customers = [],
  surcharges: surchargeTypes = [],
  invoices = [],
  onEdit,
  onRefresh,
  invoiceActions
}) => {
  const { showToast } = useToast();

  // ✅ Uproszczony stan
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dateRange, setDateRange] = useState(() => ({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  }));
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, selectedOrder: null });

  // ✅ Memoizacje dla wydajności
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const surchargeDefMap = useMemo(() => new Map(surchargeTypes.map(s => [s.code, s])), [surchargeTypes]);

  // ✅ Kliknięcie poza menu zamyka je
  useEffect(() => {
    const closeMenu = () => setContextMenu({ visible: false, x: 0, y: 0, selectedOrder: null });
    globalThis.addEventListener('click', closeMenu);
    return () => globalThis.removeEventListener('click', closeMenu);
  }, []);

  // ✅ Formatowanie szczegółów ładunku
  const formatCargoDetails = useCallback((cargo) => {
    if (!cargo?.pallets?.length) return 'No cargo data';
    const aggregated = cargo.pallets.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + (Number(p.quantity) || 0);
      return acc;
    }, {});

    return (
      <div className="cargo-breakdown">
        {Object.entries(aggregated).map(([type, qty]) => (
          <div key={type} className="cargo-row">
            <span>{qty} × {type.replace('_', ' ')}:</span>
            <strong>£{(cargo.price_breakdown?.[type] || 0).toFixed(2)}</strong>
          </div>
        ))}
      </div>
    );
  }, []);

  // ✅ Definicja kolumn tabeli
  const columns = useMemo(() => [
    {
      key: 'customer_code',
      header: 'Customer Code',
      sortable: true,
      render: (order) => customerMap.get(order.customer_id)?.customer_code || 'N/A',
    },
    { key: 'order_number', header: 'Consignment #', icon: <Package size={16} />, sortable: true },
    {
      key: 'loading',
      header: 'Loading',
      sortable: true,
      render: (order) => (
        <div>
          <div>{order.sender_details?.name}, {order.sender_details?.townCity}</div>
          <div className="date-time">{new Date(order.loading_date_time).toLocaleString()}</div>
        </div>
      ),
      sortKey: 'loading_date_time',
    },
    {
      key: 'unloading',
      header: 'Unloading',
      sortable: true,
      render: (order) => (
        <div>
          <div>{order.recipient_details?.name}, {order.recipient_details?.townCity}</div>
          <div className="date-time">{new Date(order.unloading_date_time).toLocaleString()}</div>
        </div>
      ),
      sortKey: 'unloading_date_time',
    },
    { key: 'cargo_details', header: 'Cargo Breakdown', render: (o) => formatCargoDetails(o.cargo_details) },
    { key: 'total_kilos', header: 'Total Weight (kg)', sortable: true, render: o => o.cargo_details?.total_kilos || 0 },
    { key: 'total_spaces', header: 'Total Spaces', sortable: true, render: o => o.cargo_details?.total_spaces || 0 },
    {
      key: 'calculated_price',
      header: 'Calculated Price',
      icon: <PoundSterling size={16} />,
      sortable: true,
      render: (o) => o.calculated_price ? `£${(+o.calculated_price).toFixed(2)}` : '-',
    },
    {
      key: 'surcharges',
      header: 'Surcharges',
      render: (order) => {
        const codes = order.selected_surcharges || [];
        const list = codes.map((code) => {
          const s = surchargeDefMap.get(code);
          if (!s || +s.amount <= 0) return null;
          return (
            <div key={code} className="surcharge-row">
              <span>{code.toUpperCase()} ({s.calculation_method === 'per_order' ? 'PerC' : 'PerP'}):</span>
              <strong>£{(+s.amount).toFixed(2)}</strong>
            </div>
          );
        }).filter(Boolean);
        return list.length ? <div className="surcharge-list">{list}</div> : '-';
      },
    },
    {
      key: 'final_price',
      header: 'Final Price',
      icon: <PoundSterling size={16} />,
      sortable: true,
      render: (o) => o.final_price ? `£${(+o.final_price).toFixed(2)}` : '-',
    },
  ], [customerMap, surchargeDefMap, formatCargoDetails]);

  // ✅ Filtracja dat
  const filteredOrders = useMemo(() => {
    const { start, end } = dateRange;
    return orders.filter(o => {
      const d = o.unloading_date_time;
      if (!d) return false;
      const iso = new Date(d).toISOString().split('T')[0];
      return iso >= start && iso <= end;
    });
  }, [orders, dateRange]);

  // ✅ Sumowanie
  const totals = useMemo(() =>
    filteredOrders.reduce((acc, o) => {
      acc.kilos += o.cargo_details?.total_kilos || 0;
      acc.spaces += o.cargo_details?.total_spaces || 0;
      acc.final += +o.final_price || 0;
      return acc;
    }, { kilos: 0, spaces: 0, final: 0 }),
  [filteredOrders]);

  const footerData = {
    total_kilos: totals.kilos.toFixed(2),
    total_spaces: totals.spaces.toFixed(0),
    final_price: `£${totals.final.toFixed(2)}`,
  };

  // ✅ Eksport CSV
  const handleExport = useCallback(() => {
    const headers = columns.map(c => c.header).join(',');
    const rows = filteredOrders.map(order =>
      columns.map(col => {
        let val = order[col.key];
        if (col.render && !['cargo_details', 'surcharges'].includes(col.key)) {
          const output = col.render(order);
          val = typeof output === 'object' ? '' : output;
        }
        return `"${String(val ?? '').replaceAll('"', '""')}"`;
      }).join(',')
    );
    const blob = new Blob([headers + '\n' + rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  }, [columns, filteredOrders]);

  // ✅ Tworzenie faktury
  const handleGenerateInvoice = useCallback(async () => {
    if (!selectedCustomerId) return showToast('Please select a customer.', 'warning');
    try {
      await invoiceActions.create({ customerId: selectedCustomerId, ...dateRange });
      showToast('Invoice generated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate invoice.', 'error');
    }
  }, [selectedCustomerId, dateRange, invoiceActions, showToast]);

  // ✅ Obsługa menu kontekstowego
  const handleContextMenu = (e, order) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, selectedOrder: order });
  };

  const handleEditOrder = () => {
    if (contextMenu.selectedOrder && onEdit) onEdit(contextMenu.selectedOrder);
    setContextMenu({ visible: false, x: 0, y: 0, selectedOrder: null });
  };

  return (
    <div className="card">
      <div className="tabs-container mb-4">
        {['overview', 'invoices'].map(tab => (
          <button key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <header className="planit-section-header mb-4">
            <h3>Finance Overview</h3>
            <div className="form-group">
              <label htmlFor="finance-from-date">From</label>
              <input id="finance-from-date" type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="finance-to-date">To</label>
              <input id="finance-to-date" type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
            </div>
            <button onClick={handleExport} className="btn-secondary ml-auto">
              <Download size={16} /> Export
            </button>
          </header>

          <header className="planit-section-header mb-4 border-b">
            <h4>Invoicing</h4>
            <div className="form-group">
              <label htmlFor="finance-customer-select">Customer</label>
              <select id="finance-customer-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                <option value="">-- Select customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button className="btn-primary ml-4" disabled={!selectedCustomerId} onClick={handleGenerateInvoice}>
              <FileText size={16} /> Generate Invoice
            </button>
          </header>

          {contextMenu.visible && (
            <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
              <button onClick={handleEditOrder}>Edit Consignment</button>
            </div>
          )}

          <DataTable
            items={filteredOrders}
            columns={columns}
            filterPlaceholder="Filter by consignment or customer..."
            filterKeys={['order_number', 'customer_reference', 'recipient_details.name']}
            initialSortKey="unloading_date_time"
            onContextMenu={handleContextMenu}
            footerData={footerData}
          />
        </>
      )}

      {activeTab === 'invoices' && <InvoiceList invoices={invoices} />}
    </div>
  );
};

export default FinancePage;

FinancePage.propTypes = {
  orders: PropTypes.array,
  customers: PropTypes.array,
  surcharges: PropTypes.array,
  invoices: PropTypes.array,
  onEdit: PropTypes.func,
  onRefresh: PropTypes.func,
  invoiceActions: PropTypes.shape({
    create: PropTypes.func,
  }),
};
