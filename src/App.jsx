import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { DashboardProvider } from "@/contexts/DashboardContext.jsx";
import { PopOutProvider } from "@/contexts/PopOutContext.jsx";
import { useAuth } from "@/contexts/AuthContext.jsx";

import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import DashboardContent from "@/components/DashboardContent.jsx";

import PlanItPage from "@/pages/PlanItPage.jsx";
import AddOrderPage from "@/pages/AddOrderPage.jsx";

import LoginPage from "@/pages/LoginPage.jsx";
import RegisterPage from "@/pages/RegisterPage.jsx";

import AddOrderForm from "@/components/forms/AddOrderForm.jsx";
import { broadcastRefreshAll } from "@/utils/broadcastUtils.js";

// -------------------------------------------
// ProtectedRoute — only for authenticated users
// -------------------------------------------
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Verifying authorization...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <DashboardProvider>
      <Outlet />
    </DashboardProvider>
  );
};

// -------------------------------------------
// Edit Order Popup Window
// -------------------------------------------
const EditOrderPopOut = () => {
  const [editData, setEditData] = React.useState(null);

  React.useEffect(() => {
    const data = sessionStorage.getItem("editOrderData");
    if (data) setEditData(JSON.parse(data));
  }, []);

  const handleSuccess = () => {
    broadcastRefreshAll();
    window.close();
  };

  if (!editData) return <div className="loading">Loading order data...</div>;

  return (
    <AddOrderForm
      {...editData}
      onSuccess={handleSuccess}
      onCancel={() => window.close()}
    />
  );
};

// -------------------------------------------
// PlanIt popout window
// -------------------------------------------
const PopOutWindow = () => (
  <PopOutProvider>
    <PlanItPage isPopOut={true} />
  </PopOutProvider>
);

// -------------------------------------------
// MAIN APP ROUTER
// -------------------------------------------
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>

        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ---------- PROTECTED ROUTES ---------- */}
        <Route element={<ProtectedRoute />}>

          {/* Standalone popup windows (NOT dashboard layout) */}
          <Route path="/planit/popout" element={<PopOutWindow />} />
          <Route path="/orders/:orderId/edit" element={<EditOrderPopOut />} />

          {/* Dashboard routes (layout inside DashboardContent) */}
          <Route path="/*" element={<DashboardContent />} />

        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
