import React from 'react';
import PropTypes from 'prop-types';
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

  // 🔒 Zabezpieczenie przed brakiem danych lub użytkownika
  if (!user || !viewConfig || !currentView) {
    return <div className="view-shell"><div className="loading">Preparing view...</div></div>;
  }

  const currentViewConfig = viewConfig[currentView];

  if (!currentViewConfig) {
    console.warn(`⚠️ ViewRenderer: No config found for currentView "${currentView}"`);
    return <div className="view-shell"><div className="error-container">Unknown view: {currentView}</div></div>;
  }

  // 🧱 Bezpieczne dane - Poprawka: Pobieramy dane bezpośrednio z `data`, a nie z `viewConfig`.
  // `viewConfig` może zawierać nieaktualną referencję do danych z momentu inicjalizacji.
  // `data` jest zawsze aktualnym źródłem prawdy z `useDataFetching`.
  const dataKey = currentViewConfig.dataKey;
  const dataForView = dataKey ? data?.[dataKey] : [];
  const safeDataForView = Array.isArray(dataForView)
    ? dataForView
    : [];

  // 🪲 Debug (chroniony przed undefined)
  console.log('🧩 Rendering view:', currentView, {
    hasConfig: !!currentViewConfig,
    dataType: typeof dataForView,
    isArray: Array.isArray(dataForView),
    dataLength: Array.isArray(dataForView) ? dataForView.length : 0,
  });

  if (anyError) {
    return (
      <div className="view-shell">
        <div className="error-container">
          <h3>Error loading data</h3>
          <p className="error-message">{anyError}</p>
          <button onClick={() => handleRefresh(currentView)} className="btn-primary">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const renderImporter = () => (
    <div className="card full-width">
      <ErrorBoundary onReset={() => handleRefresh(currentView)}>
        <DataImporter
          {...activeImporterConfig}
          onSuccess={handleFormSuccess}
          onCancel={handleHideImporter}
          // Przekazujemy dedykowaną funkcję odświeżania dla bieżącego widoku
          refreshFn={() => handleRefresh(currentView)}
        />
      </ErrorBoundary>
    </div>
  );

  const renderForm = () => {
    const formProps = {
      onSuccess: handleFormSuccess,
      onCancel: handleCancelForm,
      itemToEdit,
      ...(currentView === 'orders' && { drivers, trucks, trailers, clients: customers, surcharges }),
    };
    if (typeof currentViewConfig.FormComponent !== 'function') {
      console.error(`❌ Invalid FormComponent for view "${currentView}".`, currentViewConfig.FormComponent);
      return <div className="error-container">Form component not found.</div>;
    }
    return (
      <div className="layout-container-resizable">
        <div className="card full-width">
          <ErrorBoundary onReset={() => handleRefresh(currentView)}>
            <currentViewConfig.FormComponent {...formProps} />
          </ErrorBoundary>
        </div>
      </div>
    );
  };

  const renderList = () => {
    let listProps = {
      items: safeDataForView,
      onRefresh: () => handleRefresh(currentView),
      onEdit: handleEditClick,
      isLoading: !!isLoading,
      onDelete: handleDeleteRequest,
      currentUser: user,
      autoRefreshEnabled: globalAutoRefresh
    };

    if (currentView === 'orders') {
      listProps = {
        ...listProps,
        drivers: drivers ?? [],
        trucks: trucks ?? [],
        trailers: trailers ?? [],
        zones: zones ?? [],
      };
    }

    return (
      <div className="layout-container-resizable">
        <div className="card full-width">
          <ErrorBoundary onReset={() => handleRefresh(currentView)}>
            <currentViewConfig.ListComponent {...listProps} />
          </ErrorBoundary>
        </div>
      </div>
    );
  };

  const renderComponent = () => (
    <div className="layout-container-resizable">
      <div className="card full-width">
        <ErrorBoundary>
          <currentViewConfig.Component {...currentViewConfig.props} />
        </ErrorBoundary>
      </div>
    </div>
  );

  // 🔧 Widok z pojedynczym komponentem
  if (currentViewConfig.Component && !currentViewConfig.ListComponent) {
    return <div className="view-shell">{renderComponent()}</div>;
  }

  // 📋 Widok z listą
  if (currentViewConfig.ListComponent) {
    if (activeImporterConfig) return renderImporter();
    if (showForm) return renderForm();
    return <div className="view-shell">{renderList()}</div>;
  }

  return <div className="view-shell">No component to render for this view.</div>;
};

export default ViewRenderer;

const viewShape = PropTypes.shape({
  dataKey: PropTypes.string,
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  ListComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  FormComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  props: PropTypes.object,
});

ViewRenderer.propTypes = {
  viewConfig: PropTypes.objectOf(viewShape),
};
