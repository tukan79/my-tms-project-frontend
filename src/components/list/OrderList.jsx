import React from 'react';
import { useToast } from '@/contexts/ToastContext.jsx';
import DataTable from '@/components/shared/DataTable.jsx';
import { Package, PoundSterling, Calendar, Printer } from 'lucide-react';
import api from '@/services/api.js'; // Poprawiona ścieżka
import { isPostcodeInZone } from '@/utils/postcode.js';

const OrderList = ({ items: orders = [], zones = [], onRefresh, onEdit }) => {
  const { showToast } = useToast();

  console.log('🔍 OrderList safeOrders check:', {
    orders,
    safeOrders: Array.isArray(orders) ? orders : [],
    safeOrdersLength: (Array.isArray(orders) ? orders : []).length
  });

  // Zabezpieczenie: Gwarantujemy, że `orders` jest zawsze tablicą.
  const safeOrders = Array.isArray(orders) ? orders : [];

  const [activeTab, setActiveTab] = React.useState('all'); // 'all', 'delivery', 'collections'
  const [dateRange, setDateRange] = React.useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // (4) Bezpieczniejsza konwersja dat
  const formatDateTime = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return '-';
    }
  };

  const columns = [
    // (3) Zastosowanie sortowania
    { key: 'order_number', header: 'Consignment #', icon: <Package size={16} />, sortable: true },
    { key: 'customer_reference', header: 'Customer Ref', sortable: true },
    { 
      key: 'status', 
      header: 'Status', 
      render: (order) => <span className={`status status-${order.status}`}>{order.status}</span>,
      sortable: true,
    },
    { key: 'sender_details.name', header: 'Loading', render: (order) => (
      <div>
        <div>{order.sender_details?.name}, {order.sender_details?.townCity}</div>
        <div className="date-time">{formatDateTime(order.loading_date_time)}</div>
      </div>
    )},
    { key: 'recipient_details.name', header: 'Unloading', render: (order) => (
      <div>
        <div>{order.recipient_details?.name}, {order.recipient_details?.townCity}</div>
        <div className="date-time">{formatDateTime(order.unloading_date_time)}</div>
      </div>
    )},
    {
      key: 'final_price',
      header: 'Price',
      icon: <PoundSterling size={16} />,
      render: (item) => item.final_price ? `£${parseFloat(item.final_price).toFixed(2)}` : '-', // sortable: true można dodać, jeśli jest potrzebne
    },
    {
      key: 'created_at',
      header: 'Created',
      icon: <Calendar size={16} />,
      render: (item) => new Date(item.created_at).toLocaleDateString(),
      sortable: true, // Dodano dla spójności z initialSortKey
    },
  ];

  const handlePrintLabels = async (order) => {
    try {
      const response = await api.get(`/api/orders/${order.id}/labels`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `labels_order_${order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      // (1) UX — Dodaj komunikat o sukcesie po wydruku
      showToast('Labels downloaded successfully.', 'success');
      link.remove();
    } catch (error) {
      showToast('Failed to generate labels.', 'error');
    }
  };
  
  const handleDelete = async (order) => {
    if (window.confirm(`Are you sure you want to delete order ${order.customer_reference || order.id}?`)) {
      try {
        await api.delete(`/api/orders/${order.id}`);
        showToast('Order deleted successfully.', 'success');
        onRefresh();
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete order.', 'error');
      }
    }
  };

  const filteredOrders = React.useMemo(() => {
    // Potrójne zabezpieczenie: Gwarantujemy, że operujemy na tablicy, nawet jeśli `safeOrders` jest `undefined`.
    const superSafeOrders = Array.isArray(safeOrders) ? safeOrders : [];
    let filtered = [...superSafeOrders];

    // Filtrowanie po zakładkach
    // Zabezpieczenie: Gwarantujemy, że `zones` jest tablicą przed użyciem `find`.
    const safeZones = Array.isArray(zones) ? zones : [];
    const homeZone = safeZones.find(z => z.is_home_zone);
    if (activeTab === 'delivery' && homeZone) {
      filtered = filtered.filter(order => isPostcodeInZone(order.recipient_details?.postCode, homeZone));
    } else if (activeTab === 'collections' && homeZone) {
      // Poprawka: Filtrujemy po kodzie pocztowym NADAWCY, a nie odbiorcy.
      // Fix: Filter by the SENDER's postcode, not the recipient's.
      filtered = filtered.filter(order => isPostcodeInZone(order.sender_details?.postCode, homeZone));
    }

    // Filtrowanie po zakresie dat
    const { start, end } = dateRange;
    if (start && end) {
      filtered = filtered.filter(order => {
        // Poprawka: Używamy daty załadunku dla 'collections' i daty rozładunku dla 'delivery'.
        // (2) Logika filtrów — drobna poprawka dla activeTab === 'all'
        const dateField =
          activeTab === 'collections' ? order.loading_date_time :
          activeTab === 'delivery' ? order.unloading_date_time :
          order.created_at;

        if (!dateField) return false;
        try {
          const orderDate = new Date(dateField).toISOString().split('T')[0];
          return orderDate >= start && orderDate <= end;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [safeOrders, zones, activeTab, dateRange]); // Zależności pozostają te same

  return (
    <div className="card">
      <div className="planit-section-header" style={{ padding: '0 0 1rem 0', marginBottom: '1rem' }}>
        <div className="tabs-container">
          <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Orders</button>
          <button className={`tab-button ${activeTab === 'delivery' ? 'active' : ''}`} onClick={() => setActiveTab('delivery')}>Delivery</button>
          <button className={`tab-button ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => setActiveTab('collections')}>Collections</button>
        </div>
        <div className="form-group" style={{ margin: '0 0 0 1rem', minWidth: '160px' }}>
          <label style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>From Date</label>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
        </div>
        <div className="form-group" style={{ margin: '0 0 0 1rem', minWidth: '160px' }}>
          <label style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>To Date</label>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
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
        filterKeys={['order_number', 'customer_reference', 'status', 'sender_details.townCity', 'recipient_details.townCity', 'sender_details.name', 'recipient_details.name']}
      />
    </div>
  );
};

export default OrderList;
// ostatnia zmiana (30.05.2024, 13:14:12)