// src/components/DashboardContent.jsx — FINAL CLEAN VERSION

import React from "react";
import { Routes, Route } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import Sidebar from "./shared/Sidebar.jsx";
import MainHeader from "./shared/MainHeader.jsx";
import ViewRenderer from "./shared/ViewRenderer.jsx";
import ConfirmationModal from "./shared/ConfirmationModal.jsx";

import AddOrderPage from "@/pages/AddOrderPage.jsx";

import { PopOutProvider } from "@/contexts/PopOutContext.jsx";
import { useDashboard } from "@/contexts/DashboardContext.jsx";

export default function DashboardContent() {
  const {
    modalState,
    handleCloseModal,
    viewConfig,
    globalAutoRefresh,
    setGlobalAutoRefresh,
  } = useDashboard();

  // -------------------------------------
  // SAFETY: If view config is not ready yet
  // -------------------------------------
  if (!viewConfig || Object.keys(viewConfig).length === 0) {
    return <div className="loading">Initializing dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper">

      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT SECTION */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* HEADER */}
        <MainHeader viewConfig={viewConfig} />

        {/* MAIN CONTENT AREA */}
        <main className="main-container">
          <div className="content-wrapper">

            <Routes>

              {/* MAIN DASHBOARD VIEW */}
              <Route
                path="/"
                element={
                  <PopOutProvider>
                    <ViewRenderer viewConfig={viewConfig} />
                  </PopOutProvider>
                }
              />

              {/* STATIC PAGES (inside dashboard layout) */}
              <Route path="/orders/add" element={<AddOrderPage />} />

            </Routes>
          </div>
        </main>
      </div>

      {/* GLOBAL CONFIRMATION MODAL */}
      {modalState?.isOpen && (
        <ConfirmationModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
