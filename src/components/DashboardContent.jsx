// src/components/DashboardContent.jsx
import React from 'react';
import Sidebar from './shared/Sidebar.jsx';
import MainHeader from './shared/MainHeader.jsx';
import ViewRenderer from './shared/ViewRenderer.jsx';
import ConfirmationModal from './shared/ConfirmationModal.jsx';
import { PopOutProvider } from '@/contexts/PopOutContext.jsx';
import { useDashboard } from '../contexts/DashboardContext.jsx';

const DashboardContent = () => {
  const dashboardData = useDashboard();
  const {
    modalState,
    handleCloseModal,
    globalAutoRefresh,
    viewConfig,
  } = dashboardData;

  if (!viewConfig || Object.keys(viewConfig).length === 0) {
    return <div className="loading">Initializing dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      {/* LEWA KOLUMNA */}
      <Sidebar />

      {/* PRAWA KOLUMNA */}
      <div className="flex flex-col flex-1 min-w-0">
        <MainHeader viewConfig={viewConfig} />

        {/* GŁÓWNY OBSZAR TREŚCI */}
        <main className="main-container">
          <div className="content-wrapper">
            <PopOutProvider>
              <ViewRenderer
                data={dashboardData}
                viewConfig={viewConfig}
                autoRefreshEnabled={globalAutoRefresh}
              />
            </PopOutProvider>
          </div>
        </main>
      </div>

      {modalState?.isOpen && (
        <ConfirmationModal
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DashboardContent;
