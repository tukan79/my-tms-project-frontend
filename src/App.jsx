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

/* -------------------------------------------------------
   PROTECTED ROUTE – users must be authenticated
------------------------------------------------------- */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Verifying authorization...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardProvider>
      <Outlet />
    </DashboardProvider>
  );
};

/* -------------------------------------------------------
   EDIT ORDER — opens in a separate popup window
------------------------------------------------------- */
const EditOrderPopOut = () => {
  const [editData, setEditData] = React.useState(null);

  React.useEffect(() => {
    const stored = sessionStorage.getItem("editOrderData");
    if (stored) setEditData(JSON.parse(stored));
  }, []);

  const handleSuccess = () => {
    broadcastRefreshAll();
    window.close();
  };

  if (!editData) {
    return <div className="loading">Loading order data...</div>;
  }

  return (
    <AddOrderForm
      {...editData}
      onSuccess={handleSuccess}
      onCancel={() => window.close()}
    />
  );
};

/* -------------------------------------------------------
   PLAN-IT POPOUT — runs standalone without dashboard layout
------------------------------------------------------- */
const PopOutWindow = () => (
  <PopOutProvider>
    <PlanItPage isPopOut={true} />
  </PopOutProvider>
);

/* -------------------------------------------------------
   MAIN APP ROUTER
------------------------------------------------------- */
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>

        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ---------- PROTECTED ROUTES ---------- */}
        <Route element={<ProtectedRoute />}>

          {/* Standalone popouts */}
          <Route path="/planit/popout" element={<PopOutWindow />} />
          <Route path="/orders/:orderId/edit" element={<EditOrderPopOut />} />

          {/* Dashboard with all internal routed views */}
          <Route path="/*" element={<DashboardContent />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
