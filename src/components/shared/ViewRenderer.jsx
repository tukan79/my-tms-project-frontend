import React from 'react';
import ErrorBoundary from '../ErrorBoundary.jsx';
import DataImporter from '../DataImporter.jsx';
import { useDashboard } from '../contexts/DashboardContext.jsx';

const ViewRenderer = ({ viewConfig, autoRefreshEnabled }) => {
  const {
    currentView, isLoading, anyError, handleRefresh,
    importerConfig: activeImporterConfig, // Poprawka: odczytujemy 'importerConfig' i zmieniamy nazwę
    handleFormSuccess, handleHideImporter,
    showForm, handleCancelForm, itemToEdit, handleEditClick,
    handleDeleteRequest, user, data
  } = useDashboard();

  const { drivers, trucks, trailers, customers, zones, surcharges } = data || {};

  if (!user) return null;
  if (!viewConfig) return null; // Dodatkowe zabezpieczenie

  const currentViewConfig = viewConfig[currentView];
  if (!currentViewConfig) return null;

  // Widoki, które są pojedynczymi, autonomicznymi komponentami (np. PlanItPage, RunManager)
  if (currentViewConfig.Component && !currentViewConfig.ListComponent) {
    return <ErrorBoundary><currentViewConfig.Component {...currentViewConfig.props} /></ErrorBoundary>;
  }

  // Zabezpieczenie: Gwarantujemy, że dane dla widoku są zawsze tablicą.
  // To zapobiega błędom, gdy `currentViewConfig.data` jest `undefined`.
  const safeDataForView = Array.isArray(currentViewConfig?.data) ? currentViewConfig.data : [];

  if (anyError) {
    return (
      <div className="error-container">
        <h3>Error loading data</h3>
        <p className="error-message">{anyError}</p>
        <button onClick={() => handleRefresh(currentView)} className="btn-primary">
          Try again
        </button>
      </div>
    );
  }

  // Widoki składające się z listy i formularza (np. Orders, Drivers)
  if (currentViewConfig.ListComponent) {
    if (activeImporterConfig) {
      return <ErrorBoundary onReset={() => handleRefresh(currentView)}><DataImporter {...activeImporterConfig} onSuccess={handleFormSuccess} onCancel={handleHideImporter} /></ErrorBoundary>;
    }

    if (showForm) {
      const formProps = {
        onSuccess: handleFormSuccess,
        onCancel: handleCancelForm,
        itemToEdit: itemToEdit,
        ...(currentView === 'orders' && { drivers, trucks, trailers, clients: customers, surcharges }),
      };
      return <ErrorBoundary onReset={() => onRefresh(currentView)}><currentViewConfig.FormComponent {...formProps} /></ErrorBoundary>;
    }

    const listProps = {
      items: safeDataForView, // Używamy zabezpieczonych danych
      onRefresh: () => handleRefresh(currentView),
      onEdit: handleEditClick,
      isLoading: isLoading && !Array.isArray(safeDataForView), // Sprawdzamy zabezpieczone dane
      onDelete: handleDeleteRequest,
      currentUser: user,
      autoRefreshEnabled: autoRefreshEnabled, // Przekazujemy stan auto-odświeżania
      ...(currentView === 'orders' && { drivers, trucks, trailers, zones }),
    };

    console.log('🔄 Rendering ListComponent:', {
      view: currentView,
      component: currentViewConfig.ListComponent.name,
      itemsCount: safeDataForView.length,
      listProps
    });

    return <ErrorBoundary onReset={() => handleRefresh(currentView)}><currentViewConfig.ListComponent {...listProps} /></ErrorBoundary>;
  }

  return null;
};

export default ViewRenderer;
// ostatnia zmiana (30.05.2024, 20:14:12)