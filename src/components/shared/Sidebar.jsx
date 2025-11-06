import React from 'react';
import {
  Package, Link2, Users, Truck, User, LogOut, LayoutDashboard,
  Settings, PoundSterling, Briefcase, RefreshCw
} from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext.jsx';

const getInitials = (user) => {
  if (!user) return '';
  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }
  const namePart = user.email.split('@')[0];
  const parts = namePart.split(/[._-]/).filter(Boolean);
  return parts.map(part => part.charAt(0)).join('').substring(0, 2).toUpperCase();
};

const navLinksConfig = [
  {
    title: 'Main',
    icon: <LayoutDashboard size={16} />,
    links: [
      { view: 'orders', label: 'Orders', icon: <Package size={18} />, roles: ['admin', 'dispatcher'] },
      { view: 'runs', label: 'Runs', icon: <Link2 size={18} />, roles: ['admin', 'dispatcher'] },
    ]
  },
  {
    title: 'PlanIt',
    icon: <Truck size={16} />,
    links: [{ view: 'planit', label: 'PlanIt', icon: <Truck size={18} />, roles: ['admin', 'dispatcher'] }]
  },
  {
    title: 'Finance',
    icon: <Briefcase size={16} />,
    links: [{ view: 'finance', label: 'Finance', icon: <Briefcase size={18} />, roles: ['admin'] }]
  },
  {
    title: 'Management',
    icon: <Settings size={16} />,
    links: [
      { view: 'drivers', label: 'Drivers', icon: <User size={18} />, roles: ['admin'] },
      { view: 'trucks', label: 'Vehicles', icon: <Truck size={18} />, roles: ['admin'] },
      { view: 'trailers', label: 'Trailers', icon: <Truck size={18} style={{ transform: 'scaleX(-1)' }} />, roles: ['admin'] },
      { view: 'customers', label: 'Customers', icon: <Users size={18} />, roles: ['admin'] },
      { view: 'users', label: 'Users', icon: <Users size={18} />, roles: ['admin'] }
    ]
  },
  {
    title: 'Settings',
    icon: <Settings size={16} />,
    links: [
      { view: 'pricing', label: 'Pricing', icon: <PoundSterling size={18} />, roles: ['admin'] },
      { view: 'surcharges', label: 'Surcharges', icon: <Briefcase size={18} />, roles: ['admin'] },
    ]
  }
];

const Sidebar = () => {
  const { user, handleLogout, currentView, handleViewChange, isLoading, globalAutoRefresh, setGlobalAutoRefresh } = useDashboard();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="user-avatar" title={user?.email}>
          <span>{getInitials(user)}</span>
        </div>
        <button onClick={handleLogout} className="btn-icon btn-logout" title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      {/* 🔄 Globalny przełącznik auto-refresh */}
      <div className="sidebar-auto-refresh" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginLeft: '1rem' }}>
        <RefreshCw size={16} />
        <label style={{ fontSize: '0.9rem', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={globalAutoRefresh}
            onChange={(e) => setGlobalAutoRefresh(e.target.checked)}
            style={{ marginRight: '0.4rem' }}
          />
          Auto Refresh
        </label>
      </div>

      <h1 className="sidebar-title">🚛 TMS System</h1>
      {isLoading && <div className="global-loading">Loading...</div>}
      <div className="sidebar-content">
        {navLinksConfig.map(section => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-icon">{section.icon}</div>
            {section.links.filter(link => link.roles.includes(user?.role)).map(link => (
              <button key={link.view} title={link.label} className={`tab ${currentView === link.view ? 'tab-active' : ''}`} onClick={() => handleViewChange(link.view)} disabled={isLoading}>
                {link.icon}
              </button>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;