import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DashboardProvider } from '@/contexts/DashboardContext.jsx';
import { PopOutProvider } from '@/contexts/PopOutContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import DashboardContent from '@/components/DashboardContent.jsx';
import PlanItPage from '@/pages/PlanItPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import AddOrderForm from '@/components/AddOrderForm.jsx';
import { broadcastRefreshAll } from '@/utils/broadcastUtils.js';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="loading">Verifying authorization...</div>;
  }
  // The DashboardProvider should wrap the Outlet to provide context to all protected routes
  return isAuthenticated ? (
    <DashboardProvider>
      <Outlet />
    </DashboardProvider>
  ) : (
    <Navigate to="/login" replace />
  );
};

const EditOrderPopOut = () => {
  const [editData, setEditData] = React.useState(null);

  React.useEffect(() => {
    const data = sessionStorage.getItem('editOrderData');
    if (data) setEditData(JSON.parse(data));
  }, []);

  const handleSuccess = () => {
    broadcastRefreshAll();
    window.close();
  };

  if (!editData) return <div className="loading">Loading order data...</div>;

  return (
    <AddOrderForm {...editData} onSuccess={handleSuccess} onCancel={() => window.close()} />
  );
};

const PopOutWindow = () => (
  <PopOutProvider>
    <PlanItPage isPopOut={true} />
  </PopOutProvider>
);

function App() {
  return (
    // ErrorBoundary should be inside the Router to catch routing errors
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          {/* DashboardContent is the main layout for authenticated users */}
          <Route path="/*" element={<DashboardContent />} />
          <Route path="/planit/popout" element={<PopOutWindow />} />
          <Route path="/orders/:orderId/edit" element={<EditOrderPopOut />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;