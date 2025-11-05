// ZoneList.jsx
import React, { useState } from 'react';
import DataTable from '../shared/DataTable.jsx';
import api from '../services/api.js';
import { useToast } from '../contexts/ToastContext.jsx';

const ZoneList = ({ items: zones = [], onRefresh, onEdit }) => {
  const safeZones = Array.isArray(zones) ? zones : [];
  const [expandedZones, setExpandedZones] = useState({});
  const { showToast } = useToast();

  const toggleZoneExpansion = (zoneId) => {
    setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const columns = [
    { key: 'zone_name', header: 'Zone Name', sortable: true },
    {
      key: 'postcode_patterns',
      header: 'Postcode Patterns',
      render: (zone) => {
        const patterns = Array.isArray(zone.postcode_patterns) ? zone.postcode_patterns : [];
        const isExpanded = expandedZones[zone.id];
        const patternsToShow = isExpanded ? patterns : patterns.slice(0, 5);

        return (
          <div className="tag-container">
            {patterns.length === 0 ? (
              <span className="tag-empty">No postcodes defined</span>
            ) : (
              <>
                {patternsToShow.map((pattern, index) => (
                  <span key={index} className="tag">{pattern}</span>
                ))}
                {patterns.length > 5 && (
                  <button
                    onClick={() => toggleZoneExpansion(zone.id)}
                    className="btn-link"
                  >
                    {isExpanded ? '▲ Show less' : `▼ +${patterns.length - 5} more`}
                  </button>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      key: 'is_home_zone',
      header: 'Home Zone',
      render: (zone) => (zone.is_home_zone ? 'Yes' : 'No'),
    },
  ];

  const handleDelete = async (zone) => {
    if (zone.is_home_zone) {
      showToast('You cannot delete the home zone.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete zone "${zone.zone_name}"?`)) {
      try {
        await api.delete(`/api/zones/${zone.id}`);
        showToast('Zone deleted successfully.', 'success');
        onRefresh();
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete zone.', 'error');
      }
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

export default ZoneList;
// ostatnia zmiana (04.11.2025)
