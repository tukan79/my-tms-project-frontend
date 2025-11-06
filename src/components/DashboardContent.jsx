import React from 'react';
import Sidebar from './shared/Sidebar.jsx';
import MainHeader from './shared/MainHeader.jsx';
import ViewRenderer from './shared/ViewRenderer.jsx';
import { viewConfig } from '../config/viewConfig.jsx';
import ConfirmationModal from './shared/ConfirmationModal.jsx';
import { useDashboard } from '../contexts/DashboardContext.jsx';

const DashboardContent = () => {
  const { modalState, handleCloseModal, globalAutoRefresh } = useDashboard();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <MainHeader viewConfig={viewConfig} />
        <div className="view-container">
          <ViewRenderer
            viewConfig={viewConfig}
            autoRefreshEnabled={globalAutoRefresh}
          />
        </div>
      </main>
      {modalState.isOpen && (
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
