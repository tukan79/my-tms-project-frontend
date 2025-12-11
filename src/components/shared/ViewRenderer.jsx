// ViewRenderer.jsx — wersja naprawiona (FINAL)

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import DataImporter from '@/components/DataImporter.jsx';
import { useDashboard } from '@/contexts/DashboardContext.jsx';

const ViewRenderer = ({ viewConfig }) => {
  const {
    currentView, isLoading, anyError, handleRefresh,
    importerConfig: activeImporterConfig,
    handleFormSuccess, handleHideImporter,
    showForm, handleCancelForm, itemToEdit, handleEditClick,
    handleDeleteRequest, user, data, globalAutoRefresh
  } = useDashboard();

  const { drivers = [], trucks = [], trailers = [], customers = [], zones = [], surcharges = [] } = data || {};

  if (!user || !viewConfig || !currentView) {
    return (
      <div className="view-shell">
        <div className="loading">Preparing view...</div>
      </div>
    );
  }

  const currentViewConfig = viewConfig[currentView];
  if (!currentViewConfig) {
    return (
      <div className="view-shell">
        <div className="error-container">Unknown view: {currentView}</div>
      </div>
    );
  }

  const dataKey = currentViewConfig.dataKey;
  const dataForView = dataKey ? data?.[dataKey] : [];
  const safeDataForView = Array.isArray(dataForView) ? dataForView : [];

  if (anyError) {
    return (
      <div className="view-shell content-wrapper">
        <div className="card">
          <h3>Error loading data</h3>
          <p>{anyError}</p>
          <button className="btn-primary" onClick={() => handleRefresh(currentView)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // IMPORTER
  if (activeImporterConfig) {
    return (
      <div className="view-shell content-wrapper">
        <div className="card">
          <ErrorBoundary>
            <DataImporter
              {...activeImporterConfig}
              onSuccess={handleFormSuccess}
              onCancel={handleHideImporter}
              refreshFn={() => handleRefresh(currentView)}
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // FORMULARZ
  if (showForm && currentViewConfig.FormComponent) {
    const formProps = {
      onSuccess: handleFormSuccess,
      onCancel: handleCancelForm,
      itemToEdit,
      ...(currentView === 'orders' && {
        drivers, trucks, trailers, clients: customers, surcharges
      }),
    };

    return (
      <div className="view-shell">
        <div className="content-wrapper">
          <ErrorBoundary>
            <currentViewConfig.FormComponent {...formProps} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // LISTA
  if (currentViewConfig.ListComponent) {
    const listProps = {
      items: safeDataForView,
      onRefresh: () => handleRefresh(currentView),
      onEdit: handleEditClick,
      isLoading: !!isLoading,
      onDelete: handleDeleteRequest,
      currentUser: user,
      autoRefreshEnabled: globalAutoRefresh,
      ...(currentView === 'orders' && {
        drivers, trucks, trailers, zones,
      }),
    };

    return (
      <div className="view-shell content-wrapper">
        <ErrorBoundary>
          <currentViewConfig.ListComponent {...listProps} />
        </ErrorBoundary>
      </div>
    );
  }

  // POJEDYNCZY KOMPONENT
  if (currentViewConfig.Component) {
    return (
      <div className="view-shell content-wrapper">
        <ErrorBoundary>
          <currentViewConfig.Component {...currentViewConfig.props} />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="view-shell content-wrapper">
      No component to render.
    </div>
  );
};

export default ViewRenderer;
