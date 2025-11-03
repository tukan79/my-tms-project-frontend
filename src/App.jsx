//app.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Printer } from 'lucide-react';
import DriverList from './components/list/DriverList.jsx';
import AddDriverForm from './components/forms/AddDriverForm.jsx';
import TruckList from './components/list/TruckList.jsx';
import AddTruckForm from './components/forms/AddTruckForm.jsx';
import TrailerList from './components/list/TrailerList.jsx';
import AddTrailerForm from './components/forms/AddTrailerForm.jsx';
import CustomerList from './components/list/CustomerList.jsx';
import AddCustomerForm from './components/forms/AddCustomerForm.jsx';
import OrderList from './components/list/OrderList.jsx';
import AddOrderForm from './components/AddOrderForm.jsx';
import UserList from './components/list/UserList.jsx';
import AddUserForm from './components/forms/AddUserForm.jsx';
import RunManager from './components/management/RunManager.jsx';
import PricingPage from './pages/PricingPage.jsx';
import { useBroadcastChannel } from './hooks/useBroadcastChannel.js';
import PlanItPage from './pages/PlanItPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import FinancePage from './pages/FinancePage.jsx';
import api from './services/api.js';
import AddZoneForm from './components/forms/AddZoneForm.jsx';
import SurchargeTypesManager from './components/SurchargeTypesManager.jsx';
import ConfirmationModal from './components/shared/ConfirmationModal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx'; // Importuj ErrorBoundary
import { DashboardProvider, useDashboard } from './contexts/DashboardContext.jsx'; // Importujemy Provider i hook
import LoginPage from './pages/LoginPage.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { PopOutProvider } from './contexts/PopOutContext.jsx';
import ViewRenderer from './components/shared/ViewRenderer.jsx';
import Sidebar from './components/shared/Sidebar.jsx'; // Import nowego komponentu
import MainHeader from './components/shared/MainHeader.jsx'; // Import nowego komponentu
import BugReportButton from './components/shared/BugReportButton.jsx'; // Import przycisku do zgłaszania błędów
import { generateViewConfig } from './config/viewConfig.jsx';

// Tymczasowy debug
console.log('🌐 Environment variables:');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Mode:', import.meta.env.MODE);



const DashboardContent = () => {
  const {
    user,
    modalState,
    handleCloseModal,
    handleDeleteRequest,
    showToast,
    data,
    isLoading, // Dodajemy isLoading z hooka useDashboard
    anyError, // Dodajemy anyError z hooka useDashboard
    refreshAll,
    actions,
  } = useDashboard();

  console.log('🔍 COMPLETE Dashboard data structure:', {
    data,
    isLoading,
    // Sprawdź WSZYSTKIE properties
    orders: data?.orders?.length,
    drivers: data?.drivers?.length,
    trucks: data?.trucks?.length,
    trailers: data?.trailers?.length,
    users: data?.users?.length,
    assignments: data?.assignments?.length,
    customers: data?.customers?.length,
    zones: data?.zones?.length,
    surcharges: data?.surcharges?.length,
    invoices: data?.invoices?.length,
    runs: data?.runs?.length,
  });

  // Zapewniamy domyślny pusty obiekt, aby uniknąć błędów, gdy `data` jest `undefined`.
  const { customers, surcharges } = data || {};

  // Nowa, dedykowana funkcja do edycji zlecenia z dowolnego miejsca w aplikacji
  const handleEditOrderFromAnywhere = (order) => {
    if (!order || !order.id) return;
    sessionStorage.setItem('editOrderData', JSON.stringify({
      itemToEdit: order,
      clients: customers,
      surcharges,
    }));
    const url = `/orders/${order.id}/edit`;
    window.open(url, `Edit Order ${order.order_number || order.id}`, 'width=1000,height=800,resizable=yes,scrollbars=yes');
  };

  const handlePrintLabels = async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/labels`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `labels_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Failed to download labels.', 'error');
    }
  };

  // Generowanie konfiguracji widoków za pomocą nowej funkcji
  const viewConfig = useMemo(() => {
    const config = generateViewConfig({
      user,
      data,
      actions,
      refreshAll,
      handleDeleteRequest,
      handleEditOrderFromAnywhere,
      handlePrintLabels,
    });

    console.log('🔍 ViewConfig structure:', {
      configKeys: Object.keys(config),
      // Sprawdź każdy view
      ordersConfig: config.orders,
      runsConfig: config.runs,
      planitConfig: config.planit,
    });

    return config;
  }, [user, data, actions, refreshAll, handleDeleteRequest, handleEditOrderFromAnywhere, handlePrintLabels]);

  // Dodajemy klasę do body tylko dla głównej aplikacji, aby uniknąć problemów ze scrollowaniem w pop-outach
  useEffect(() => {
    document.body.classList.add('main-app-body');
    return () => {
      document.body.classList.remove('main-app-body');
    };
  }, []);

  // KLUCZOWA ZMIANA: Blokujemy renderowanie, dopóki dane nie będą gotowe.
  // Uproszczona i bardziej niezawodna logika: jeśli `data` jest `null`,
  // oznacza to, że dane początkowe wciąż się ładują.
  if (data === null) {
    return <div className="loading">Loading initial application data...</div>;
  }

  if (anyError) {
    return (
      <div className="error-container card">
        <h2>Failed to load application data</h2>
        <p>There was an error fetching essential data. Please try again.</p>
        <p className="error-message">{anyError}</p>
        <button onClick={() => refreshAll()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <MainHeader viewConfig={viewConfig} />
        <ViewRenderer viewConfig={viewConfig} />
        <ConfirmationModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onConfirm={modalState.onConfirm}
          title="Confirm Deletion"
          message={modalState.message}
        />
        <BugReportButton />
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardProvider>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </DashboardProvider>
  );
};

const EditOrderPopOut = () => {
  // Używamy hooka do wysyłania wiadomości, a nie do odświeżania
  const { postMessage } = useBroadcastChannel();
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('editOrderData');
    if (data) {
      setEditData(JSON.parse(data));
    }
  }, []);

  const handleSuccess = () => {
    // Wyślij wiadomość do głównego okna, aby odświeżyło dane
    postMessage('refresh_data');
    window.close(); // Zamknij okno po sukcesie
  };

  if (!editData) return <div className="loading">Loading order data...</div>;

  return <AddOrderForm {...editData} onSuccess={handleSuccess} onCancel={() => window.close()} />;
};

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Lub dedykowany komponent spinnera / Or a dedicated spinner component
    return <div className="loading">Verifying authorization...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PopOutWindow = ({ view }) => {
  return (
    // Owijamy PlanItPage w PopOutProvider, który dostarczy dane z sessionStorage.
    <PopOutProvider>
      <div className="popout-container">
        <PlanItPage isPopOut={true} />
      </div>
    </PopOutProvider>
  );
};

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Grouping protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Dashboard />} />
          <Route path="/planit/popout" element={<PopOutWindow />} />
          <Route path="/orders/:orderId/edit" element={<DashboardProvider><EditOrderPopOut /></DashboardProvider>} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
// ostatnia zmiana (30.05.2024, 13:14:12)