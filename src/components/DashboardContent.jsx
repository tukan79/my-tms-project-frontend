import React from 'react';
import Sidebar from './shared/Sidebar.jsx';
import MainHeader from './shared/MainHeader.jsx';
import ViewRenderer from './shared/ViewRenderer.jsx';
import ConfirmationModal from './shared/ConfirmationModal.jsx';
import { PopOutProvider } from '@/contexts/PopOutContext.jsx';
import { useDashboard } from '../contexts/DashboardContext.jsx';

const DashboardContent = () => {
  const { modalState, handleCloseModal, globalAutoRefresh, viewConfig } = useDashboard();

  if (!viewConfig) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">

      {/* LEWA KOLUMNA */}
      <Sidebar />

      {/* PRAWA KOLUMNA */}
      <div className="flex flex-col flex-1 min-w-0">

        <MainHeader viewConfig={viewConfig} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <PopOutProvider>
            <ViewRenderer
              viewConfig={viewConfig}
              autoRefreshEnabled={globalAutoRefresh}
            />
          </PopOutProvider>
        </main>

      </div>

      {modalState?.isOpen && (
        <ConfirmationModal
          message={modalState?.message}
          onConfirm={modalState?.onConfirm}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DashboardContent;
