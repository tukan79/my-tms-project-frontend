import React, { useState, useEffect } from 'react';
import ZoneManager from '@/components/ZoneManager.jsx';
import RateCardEditor from '@/components/RateCardEditor.jsx';
import { RefreshCw } from 'lucide-react';

const AUTO_REFRESH_INTERVAL = 30000; // 🔁 30 sekund — możesz zmienić np. na 60000 (1 minuta)

const PricingPage = ({ customers = [], zones = [], onRefresh }) => {
  const [activeTab, setActiveTab] = useState('zones');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔁 Automatyczne odświeżanie co X sekund
  useEffect(() => {
    if (!onRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      try {
        await onRefresh();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [onRefresh]);

  // 🔘 Manualne odświeżenie
  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Pricing Management</h2>

        <button
          onClick={handleManualRefresh}
          className={`refresh-button ${isRefreshing ? 'spinning' : ''}`}
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="tabs-container" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-button ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          Postcode Zones
        </button>
        <button
          className={`tab-button ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => setActiveTab('rates')}
        >
          Rate Cards
        </button>
      </div>

      {activeTab === 'zones' && <ZoneManager zones={zones} onRefresh={onRefresh} />}
      {activeTab === 'rates' && <RateCardEditor customers={customers} zones={zones} />}

      {/* 📅 Info o ostatnim odświeżeniu */}
      <div className="refresh-info">
        {lastRefresh ? (
          <p>Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
        ) : (
          <p>Waiting for first refresh...</p>
        )}
      </div>

      <style>{`
        .card-header h2 {
          margin: 0;
        }

        .refresh-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .refresh-button:hover {
          color: #007bff;
          transform: scale(1.1);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .tab-button {
          padding: 0.5rem 1.2rem;
          margin-right: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: #f5f5f5;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .tab-button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .tab-button:hover {
          background: #e0e0e0;
        }

        .refresh-info {
          margin-top: 1rem;
          font-size: 0.9rem;
          color: #777;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default PricingPage;

// ostatnia zmiana (04.11.2025, 23:23)
