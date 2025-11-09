import React from 'react';
import Sidebar from './shared/Sidebar.jsx';
import MainHeader from './shared/MainHeader.jsx';
import ViewRenderer from './shared/ViewRenderer.jsx';
import ConfirmationModal from './shared/ConfirmationModal.jsx';
import { PopOutProvider } from '@/contexts/PopOutContext.jsx';
import { useDashboard } from '../contexts/DashboardContext.jsx';

const DashboardContent = () => {
  const { modalState, handleCloseModal, globalAutoRefresh, viewConfig } = useDashboard();

  // ⛔ Blokujemy render, dopóki viewConfig nie jest gotowy
  if (!viewConfig) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
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
