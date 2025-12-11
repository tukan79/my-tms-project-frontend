// src/components/DashboardContent.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./shared/Sidebar.jsx";
import MainHeader from "./shared/MainHeader.jsx";
import ViewRenderer from "./shared/ViewRenderer.jsx";
import ConfirmationModal from "./shared/ConfirmationModal.jsx";

import AddOrderPage from "@/pages/AddOrderPage.jsx";
import { PopOutProvider } from "@/contexts/PopOutContext.jsx";
import { useDashboard } from "@/contexts/DashboardContext.jsx";

export default function DashboardContent() {
  const dashboardData = useDashboard();
  const { modalState, handleCloseModal, globalAutoRefresh, viewConfig } =
    dashboardData;

  if (!viewConfig || Object.keys(viewConfig).length === 0) {
    return <div className="loading">Initializing dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN RIGHT SECTION */}
      <div className="flex flex-col flex-1 min-w-0">
        <MainHeader viewConfig={viewConfig} />

        {/* MAIN FLOW */}
        <main className="main-container">
          <div className="content-wrapper">

            {/* INTERNAL ROUTING */}
            <Routes>

              {/* Dashboard dynamic views */}
              <Route
                path="/"
                element={
                  <PopOutProvider>
                    <ViewRenderer
                      data={dashboardData}
                      viewConfig={viewConfig}
                      autoRefreshEnabled={globalAutoRefresh}
                    />
                  </PopOutProvider>
                }
              />

              {/* STATIC PAGES inside dashboard */}
              <Route path="/orders/add" element={<AddOrderPage />} />

            </Routes>
          </div>
        </main>
      </div>

      {/* MODAL */}
      {modalState?.isOpen && (
        <ConfirmationModal
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
}
