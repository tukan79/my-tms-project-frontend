import React from 'react';
import Sidebar from './shared/Sidebar.jsx';
import MainHeader from './shared/MainHeader.jsx';
import ViewRenderer from './shared/ViewRenderer.jsx';
import ConfirmationModal from './shared/ConfirmationModal.jsx';
import { PopOutProvider } from '@/contexts/PopOutContext.jsx';
import { useDashboard } from '../contexts/DashboardContext.jsx';

const DashboardContent = () => {  
  // 1. KRYTYCZNA POPRAWKA: Usunięto podwójne pobieranie danych.
  // Wszystkie potrzebne dane i stany są teraz pobierane z jednego źródła - kontekstu DashboardContext.
  const dashboardData = useDashboard();
  const { 
    modalState, 
    handleCloseModal, 
    globalAutoRefresh, 
    viewConfig 
  } = dashboardData;

  // Zabezpieczenie: Jeśli konfiguracja widoku nie jest jeszcze gotowa, wyświetl ekran ładowania.
  if (!viewConfig || Object.keys(viewConfig).length === 0) {
    return <div className="loading">Initializing dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">

      {/* LEWA KOLUMNA */}
      <Sidebar />

      {/* PRAWA KOLUMNA */}
      <div className="flex flex-col flex-1 min-w-0">

        <MainHeader viewConfig={viewConfig} />

        <main className="main-container">
          <div className="content-wrapper">
            <PopOutProvider>
              <ViewRenderer
                data={dashboardData} // Przekazujemy cały obiekt z kontekstu, aby ViewRenderer miał dostęp do wszystkiego.
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
