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
    <nav className="sidebar w-64 flex-shrink-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">

      <div className="sidebar-header flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
        <div className="user-avatar w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold" title={user?.email}>
          <span>{getInitials(user)}</span>
        </div>
        <button onClick={handleLogout} className="btn-icon btn-logout" title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      <div className="sidebar-auto-refresh flex items-center gap-2 p-4">
        <RefreshCw size={16} />
        <label className="text-sm">
          <input
            type="checkbox"
            checked={globalAutoRefresh}
            onChange={(e) => setGlobalAutoRefresh(e.target.checked)}
            className="mr-2"
          />
          <span>Auto Refresh</span>
        </label>
      </div>

      <h1 className="sidebar-title px-4 py-2 text-lg font-semibold">🚛 TMS System</h1>

      {isLoading && <div className="global-loading px-4 py-2">Loading...</div>}

      <div className="sidebar-content flex-1 overflow-y-auto px-2">
        {navLinksConfig.map(section => (
          <div key={section.title} className="sidebar-section mb-4">

            <div className="sidebar-section-icon flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300">
              {section.icon}
              <span className="text-sm">{section.title}</span>
            </div>

            {section.links.filter(link => link.roles.includes(user?.role)).map(link => (
              <button
                key={link.view}
                title={link.label}
                className={`tab w-full flex items-center gap-3 px-4 py-2 rounded-md my-1 
                ${currentView === link.view ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                onClick={() => handleViewChange(link.view)}
                disabled={isLoading}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}

          </div>
        ))}
      </div>

    </nav>
  );
};

export default Sidebar;
