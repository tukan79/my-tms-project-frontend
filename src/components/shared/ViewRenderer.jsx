// frontend/src/components/ViewRenderer.jsx
import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import DataImporter from '@/components/DataImporter.jsx';
import { useDashboard } from '@/contexts/DashboardContext.jsx';

const ViewRenderer = ({ viewConfig, autoRefreshEnabled }) => {
  const {
    currentView, isLoading, anyError, handleRefresh,
    importerConfig: activeImporterConfig,
    handleFormSuccess, handleHideImporter,
    showForm, handleCancelForm, itemToEdit, handleEditClick,
    handleDeleteRequest, user, data
  } = useDashboard();

  const { drivers, trucks, trailers, customers, zones, surcharges } = data || {};

  if (!user || !viewConfig) return null;

  const currentViewConfig = viewConfig[currentView];
  if (!currentViewConfig) return null;

  // 🧩 Debug log
  console.log('🧩 Rendering view:', currentView, {
    currentViewConfig,
    dataType: typeof currentViewConfig?.data,
    isArray: Array.isArray(currentViewConfig?.data),
    dataSample: currentViewConfig?.data?.slice?.(0, 1) ?? currentViewConfig?.data
  });

  // 🧱 Zabezpieczenie — dane ZAWSZE jako tablica
  const safeDataForView = Array.isArray(currentViewConfig?.data)
    ? currentViewConfig.data
    : currentViewConfig?.data
    ? [currentViewConfig.data]
    : [];

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

  // Widok z pojedynczym komponentem
  if (currentViewConfig.Component && !currentViewConfig.ListComponent) {
    return (
      <ErrorBoundary>
        <currentViewConfig.Component {...currentViewConfig.props} />
      </ErrorBoundary>
    );
  }

  // Widok z listą i formularzem
  if (currentViewConfig.ListComponent) {
    if (activeImporterConfig) {
      return (
        <ErrorBoundary onReset={() => handleRefresh(currentView)}>
          <DataImporter
            {...activeImporterConfig}
            onSuccess={handleFormSuccess}
            onCancel={handleHideImporter}
          />
        </ErrorBoundary>
      );
    }

    if (showForm) {
      const formProps = {
        onSuccess: handleFormSuccess,
        onCancel: handleCancelForm,
        itemToEdit,
        ...(currentView === 'orders' && { drivers, trucks, trailers, clients: customers, surcharges }),
      };
      return (
        <ErrorBoundary onReset={() => handleRefresh(currentView)}>
          <currentViewConfig.FormComponent {...formProps} />
        </ErrorBoundary>
      );
    }

    const listProps = {
      items: safeDataForView,
      onRefresh: () => handleRefresh(currentView),
      onEdit: handleEditClick,
      isLoading: isLoading && !Array.isArray(safeDataForView),
      onDelete: handleDeleteRequest,
      currentUser: user,
      autoRefreshEnabled,
      ...(currentView === 'orders' && { drivers, trucks, trailers, zones }),
    };

    return (
      <ErrorBoundary onReset={() => handleRefresh(currentView)}>
        <currentViewConfig.ListComponent {...listProps} />
      </ErrorBoundary>
    );
  }

  return null;
};

export default ViewRenderer;
