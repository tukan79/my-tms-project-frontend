// src/components/shared/MainHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  Plus,
  Upload,
  Download,
  RefreshCw,
} from 'lucide-react';

import { useDashboard } from '@/contexts/DashboardContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { importerConfigs } from '@/config/importerConfig.jsx';

const MainHeader = ({ viewConfig }) => {
  const { user } = useAuth();

  const {
    currentView,
    showForm,
    importerConfig: activeImporter,
    handleShowImporter,
    handleHideImporter,
    handleCancelForm,
    setShowForm,
    setItemToEdit,
    handleGenericExport,

    isLoading,
    globalAutoRefresh,
    setGlobalAutoRefresh,
  } = useDashboard();

  if (!viewConfig || !currentView) {
    return (
      <header className="main-header">
        <div />
        <div className="main-header-actions" />
      </header>
    );
  }

  /* -------------------------------------------
       VIEW LABELS
  ------------------------------------------- */
  const viewNames = {
    orders: 'Order',
    drivers: 'Driver',
    trucks: 'Truck',
    trailers: 'Trailer',
    runs: 'Run',
    users: 'User',
    customers: 'Customer',
    zones: 'Zone',
    planit: 'PlanIt',
    finance: 'Finance',
    pricing: 'Pricing',
  };

  const getViewName = () => viewNames[currentView] || '';

  /* -------------------------------------------
       PERMISSIONS
  ------------------------------------------- */
  const isAdmin = user?.role === 'admin';

  const canImport = !!importerConfigs[currentView] && isAdmin;
  const canExport = ['drivers', 'trucks', 'trailers', 'customers', 'users'].includes(currentView) && isAdmin;
  const canAdd = Boolean(viewConfig[currentView]?.FormComponent);

  /* -------------------------------------------
       EVENT HANDLERS
  ------------------------------------------- */
  const handleAdd = () => {
    if (showForm) {
      handleCancelForm();
      return;
    }

    setItemToEdit(null);
    handleHideImporter();
    setShowForm(true);
  };

  return (
    <header className="main-header modern-header">
      <div className="main-header-left">
        {/* Możesz dodać breadcrumb lub nazwę widoku */}
      </div>

      <div className="main-header-actions modern-actions">

        {/* 🔁 Auto Refresh Toggle */}
        <button
          type="button"
          onClick={() => setGlobalAutoRefresh(!globalAutoRefresh)}
          className={`btn-icon modern-btn-toggle ${
            globalAutoRefresh ? 'active' : ''
          }`}
          title={`Auto refresh ${globalAutoRefresh ? 'ON' : 'OFF'}`}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          <span className="toggle-label">
            {globalAutoRefresh ? 'Auto ON' : 'Auto OFF'}
          </span>
        </button>

        {/* ⬆ Import */}
        {canImport && (
          <button
            type="button"
            className="btn-secondary modern-btn"
            onClick={() => handleShowImporter(importerConfigs[currentView])}
            disabled={isLoading || showForm || activeImporter}
          >
            <Upload size={16} />
            Import CSV
          </button>
        )}

        {/* ⬇ Export */}
        {canExport && (
          <button
            type="button"
            className="btn-secondary modern-btn"
            onClick={() => handleGenericExport(currentView)}
            disabled={isLoading}
          >
            <Download size={16} />
            Export
          </button>
        )}

        {/* ➕ Add */}
        {canAdd && (
          <button
            type="button"
            className="btn-primary modern-btn"
            onClick={handleAdd}
            disabled={isLoading}
          >
            {showForm ? (
              'Cancel'
            ) : (
              <>
                <Plus size={16} /> Add {getViewName()}
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

MainHeader.propTypes = {
  viewConfig: PropTypes.objectOf(
    PropTypes.shape({
      FormComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
      ]),
    })
  ).isRequired,
};

export default MainHeader;
