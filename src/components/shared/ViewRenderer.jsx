// ViewRenderer.jsx — FINAL CLEAN MODERN VERSION
import React from 'react';
import PropTypes from 'prop-types';

import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import DataImporter from '@/components/DataImporter.jsx';
import { useDashboard } from '@/contexts/DashboardContext.jsx';

const ViewRenderer = ({ viewConfig }) => {
  const {
    currentView,
    isLoading,
    anyError,
    handleRefresh,

    importerConfig: activeImporterConfig,
    handleFormSuccess,
    handleHideImporter,

    showForm,
    handleCancelForm,
    itemToEdit,
    handleEditClick,
    handleDeleteRequest,

    user,
    data,
    globalAutoRefresh,
  } = useDashboard();

  // ------------------------------
  //  SAFETY GUARDS
  // ------------------------------
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

  // ------------------------------
  //  DATA FOR THE CURRENT VIEW
  // ------------------------------
  const safeData = Array.isArray(data?.[currentViewConfig.dataKey])
    ? data[currentViewConfig.dataKey]
    : [];

  const sharedProps = {
    drivers: data?.drivers ?? [],
    trucks: data?.trucks ?? [],
    trailers: data?.trailers ?? [],
    customers: data?.customers ?? [],
    zones: data?.zones ?? [],
    surcharges: data?.surcharges ?? [],
  };

  // ------------------------------
  //  GLOBAL ERROR HANDLING
  // ------------------------------
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

  // ------------------------------
  //  IMPORTER VIEW
  // ------------------------------
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

  // ------------------------------
  //  FORM VIEW
  // ------------------------------
  if (showForm && currentViewConfig.FormComponent) {
    const isWide =
      currentView === 'pricing' ||
      currentView === 'planit';

    const wrapperClass = isWide ? 'content-wrapper full-width' : 'content-wrapper';

    const formProps = {
      onSuccess: handleFormSuccess,
      onCancel: handleCancelForm,
      itemToEdit,
      ...(currentView === 'orders' ? sharedProps : {}),
    };

    return (
      <div className="view-shell">
        <div className={wrapperClass}>
          <ErrorBoundary>
            <currentViewConfig.FormComponent {...formProps} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // ------------------------------
  //  LIST VIEW
  // ------------------------------
  if (currentViewConfig.ListComponent) {
    const listProps = {
      items: safeData,
      onRefresh: () => handleRefresh(currentView),
      onEdit: handleEditClick,
      onDelete: handleDeleteRequest,
      isLoading: !!isLoading,
      currentUser: user,
      autoRefreshEnabled: globalAutoRefresh,

      ...(currentView === 'orders' ? sharedProps : {}),
    };

    return (
      <div className="view-shell content-wrapper">
        <ErrorBoundary>
          <currentViewConfig.ListComponent {...listProps} />
        </ErrorBoundary>
      </div>
    );
  }

  // ------------------------------
  //  SINGLE CUSTOM COMPONENT
  // ------------------------------
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

// ------------------------------
// PROP TYPES
// ------------------------------
const viewShape = PropTypes.shape({
  dataKey: PropTypes.string,
  FormComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  ListComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  props: PropTypes.object,
});

ViewRenderer.propTypes = {
  viewConfig: PropTypes.objectOf(viewShape),
};
