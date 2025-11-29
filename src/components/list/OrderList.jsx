import React from 'react';
import PropTypes from 'prop-types';
import { useToast } from '@/contexts/ToastContext.jsx';
import DataTable from '@/components/shared/DataTable.jsx';
import { Package, PoundSterling, Calendar, Printer } from 'lucide-react';
import api from '@/services/api.js';
import { isPostcodeInZone } from '@/utils/postcode.js';

const OrderList = ({ items, zones, onRefresh, onEdit }) => {
  const { showToast } = useToast();

  const safeOrders = Array.isArray(items) ? items : [];
  const safeZones = Array.isArray(zones) ? zones : [];

  const [activeTab, setActiveTab] = React.useState('all');
  const [dateRange, setDateRange] = React.useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const formatDateTime = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }

    try {
      return new Date(value).toLocaleString();
    } catch {
      return '-';
    }
  };

  const getDateField = (order) => {
    if (activeTab === 'collections') {
      return order.loading_date_time;
    }

    if (activeTab === 'delivery') {
      return order.unloading_date_time;
    }

    return order.created_at;
  };

  const columns = [
    { key: 'order_number', header: 'Consignment #', icon: <Package size={16} />, sortable: true },
    { key: 'customer_reference', header: 'Customer Ref', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (order) => (
        <span className={`status status-${order.status}`}>
          {order.status}
        </span>
      ),
    },
    {
      key: 'sender_details.name',
      header: 'Loading',
      render: (order) => (
        <div>
          <div>
            {order.sender_details?.name}, {order.sender_details?.townCity}
          </div>
          <div className="date-time">
            {formatDateTime(order.loading_date_time)}
          </div>
        </div>
      ),
    },
    {
      key: 'recipient_details.name',
      header: 'Unloading',
      render: (order) => (
        <div>
          <div>
            {order.recipient_details?.name}, {order.recipient_details?.townCity}
          </div>
          <div className="date-time">
            {formatDateTime(order.unloading_date_time)}
          </div>
        </div>
      ),
    },
    {
      key: 'final_price',
      header: 'Price',
      icon: <PoundSterling size={16} />,
      render: (item) =>
        item.final_price
          ? `£${Number(item.final_price).toFixed(2)}`
          : '-',
    },
    {
      key: 'created_at',
      header: 'Created',
      icon: <Calendar size={16} />,
      sortable: true,
      render: (item) =>
        new Date(item.created_at).toLocaleDateString(),
    },
  ];

  const handlePrintLabels = async (order) => {
    try {
      const response = await api.get(`/api/orders/${order.id}/labels`, {
        responseType: 'blob',
      });

      const blobUrl = globalThis.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = globalThis.document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `labels_order_${order.id}.pdf`);
      globalThis.document.body.appendChild(link);

      link.click();
      showToast('Labels downloaded successfully.', 'success');

      link.remove();
      globalThis.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('Failed to generate labels.', 'error');
    }
  };

  const handleDelete = async (order) => {
    const confirmed = globalThis.confirm(
      `Are you sure you want to delete order ${order.customer_reference || order.id}?`
    );

    if (confirmed !== true) {
      return;
    }

    try {
      await api.delete(`/api/orders/${order.id}`);
      showToast('Order deleted successfully.', 'success');
      onRefresh();
    } catch (error) {
      showToast(
        error.response?.data?.error || 'Failed to delete order.',
        'error'
      );
    }
  };

  const filteredOrders = React.useMemo(() => {
    let filtered = [...safeOrders];

    const homeZone = safeZones.find(
      (zone) => zone.is_home_zone === true
    );

    if (activeTab === 'delivery' && homeZone) {
      filtered = filtered.filter((order) =>
        isPostcodeInZone(order.recipient_details?.postCode, homeZone)
      );
    }

    if (activeTab === 'collections' && homeZone) {
      filtered = filtered.filter((order) =>
        isPostcodeInZone(order.sender_details?.postCode, homeZone)
      );
    }

    const { start, end } = dateRange;

    if (start && end) {
      filtered = filtered.filter((order) => {
        const dateField = getDateField(order);

        if (dateField === null || dateField === undefined) {
          return false;
        }

        try {
          const orderDate = new Date(dateField)
            .toISOString()
            .split('T')[0];

          return orderDate >= start && orderDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [safeOrders, safeZones, activeTab, dateRange]);

  return (
    <div className="card">
      <div className="planit-section-header" style={{ paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            type="button"
          >
            All Orders
          </button>

          <button
            className={`tab-button ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
            type="button"
          >
            Delivery
          </button>

          <button
            className={`tab-button ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
            type="button"
          >
            Collections
          </button>
        </div>

        <div className="form-group" style={{ marginLeft: '1rem' }}>
          <label htmlFor="fromDate">From Date</label>
          <input
            id="fromDate"
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                start: e.target.value,
              }))
            }
          />
        </div>

        <div className="form-group" style={{ marginLeft: '1rem' }}>
          <label htmlFor="toDate">To Date</label>
          <input
            id="toDate"
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                end: e.target.value,
              }))
            }
          />
        </div>
      </div>

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
            title: 'Print Pallet Labels',
          },
        ]}
        title="Order List"
        filterPlaceholder="Filter orders..."
        initialSortKey="created_at"
        filterKeys={[
          'order_number',
          'customer_reference',
          'status',
          'sender_details.townCity',
          'recipient_details.townCity',
          'sender_details.name',
          'recipient_details.name',
        ]}
      />
    </div>
  );
};

/* ✅ SonarQube: S6774 - PropTypes */
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
