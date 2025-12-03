// src/components/list/ZoneList.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import DataTable from '@/components/shared/DataTable.jsx';
import api from '@/services/api.js';
import { useToast } from '@/contexts/ToastContext.jsx';

const ZoneList = ({ items, onRefresh, onEdit }) => {
  const safeZones = Array.isArray(items) ? items : [];
  const [expandedZones, setExpandedZones] = useState({});
  const { showToast } = useToast();

  const toggleZoneExpansion = useCallback((zoneId) => {
    setExpandedZones((prev) => ({
      ...prev,
      [zoneId]: !prev[zoneId],
    }));
  }, []);

  const renderPostcodePatterns = (zone) => {
    const patterns = Array.isArray(zone.postcodePatterns || zone.postcode_patterns)
      ? zone.postcode_patterns
      : [];

    const isExpanded = Boolean(expandedZones[zone.id]);
    const patternsToShow = isExpanded
      ? patterns
      : patterns.slice(0, 5);

    if (patterns.length === 0) {
      return (
        <span className="tag-empty">
          No postcodes defined
        </span>
      );
    }

    return (
      <>
        {patternsToShow.map((pattern) => (
          <span key={pattern} className="tag">
            {pattern}
          </span>
        ))}

        {patterns.length > 5 && (
          <button
            type="button"
            onClick={() => toggleZoneExpansion(zone.id)}
            className="btn-link"
          >
            {isExpanded
              ? '▲ Show less'
              : `▼ +${patterns.length - 5} more`}
          </button>
        )}
      </>
    );
  };

  const columns = [
    {
      key: 'zone_name',
      header: 'Zone Name',
      sortable: true,
    },
    {
      key: 'postcode_patterns',
      header: 'Postcode Patterns',
      sortable: false, // Patterns are not easily sortable
      render: (zone) => (
        <div className="tag-container">
          {renderPostcodePatterns(zone)}
        </div>
      ),
    },
    {
      key: 'is_home_zone',
      header: 'Home Zone',
      render: (zone) => (zone.is_home_zone ? 'Yes' : 'No'),
      sortable: true,
    },
  ];

  const handleDelete = async (zone) => {
    if (zone.is_home_zone) {
      showToast('You cannot delete the home zone.', 'error');
      return;
    }

    const confirmed = globalThis.confirm(
      `Are you sure you want to delete zone "${zone.zone_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/api/zones/${zone.id}`);
      showToast('Zone deleted successfully.', 'success');
      onRefresh();
    } catch (error) {
      const message =
        error.response?.data?.error ||
        'Failed to delete zone.';
      showToast(message, 'error');
    }
  };

  return (
    <DataTable
      items={safeZones}
      columns={columns}
      onRefresh={onRefresh}
      onEdit={onEdit}
      onDelete={handleDelete}
      title="Postcode Zones"
      filterPlaceholder="Search zones..."
      filterKeys={['zone_name']}
    />
  );
};

ZoneList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
};

ZoneList.defaultProps = {
  items: [],
  onRefresh: undefined,
  onEdit: undefined,
};

export default ZoneList;
