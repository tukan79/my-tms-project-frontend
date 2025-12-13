import React from 'react';
import {
  Package,
  Link2,
  Users,
  Truck,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  PoundSterling,
  Briefcase,
  RefreshCw
} from 'lucide-react';

import { useDashboard } from '@/contexts/DashboardContext.jsx';

/* =======================================================
   USER INITIALS GENERATOR
======================================================= */
const getInitials = (user) => {
  if (!user) return '';
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  const name = user.email?.split('@')[0] ?? '';
  return name
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

/* =======================================================
   NAVIGATION CONFIG
======================================================= */
const navLinksConfig = [
  {
    title: 'Main',
    icon: <LayoutDashboard size={16} />,
    links: [
      { view: 'orders', label: 'Orders', icon: <Package size={18} />, roles: ['admin', 'dispatcher'] },
      { view: 'runs', label: 'Runs', icon: <Link2 size={18} />, roles: ['admin', 'dispatcher'] }
    ]
  },
  {
    title: 'PlanIt',
    icon: <Truck size={16} />,
    links: [
      { view: 'planit', label: 'PlanIt', icon: <Truck size={18} />, roles: ['admin', 'dispatcher'] }
    ]
  },
  {
    title: 'Finance',
    icon: <Briefcase size={16} />,
    links: [
      { view: 'finance', label: 'Finance', icon: <Briefcase size={18} />, roles: ['admin'] }
    ]
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
      { view: 'surcharges', label: 'Surcharges', icon: <Briefcase size={18} />, roles: ['admin'] }
    ]
  }
];

/* =======================================================
   SIDEBAR — MODERN UI 2025
======================================================= */
const Sidebar = () => {
  const {
    user,
    handleLogout,
    currentView,
    handleViewChange,
    isLoading,
    globalAutoRefresh,
    setGlobalAutoRefresh
  } = useDashboard();

  return (
    <nav className="
      sidebar 
      flex-shrink-0 h-screen 
      bg-white dark:bg-gray-900 
      border-r border-gray-200 dark:border-gray-800 
      flex flex-col shadow-sm
    ">

      {/* --------------------------------------------------
          HEADER — pinned with shadow
      -------------------------------------------------- */}
      <div className="
        sidebar-header 
        flex items-center justify-between 
        p-4 
        border-b border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-900
        sticky top-0 z-20
      ">
        <div
          className="
            user-avatar w-11 h-11 rounded-full 
            bg-blue-600 text-white 
            flex items-center justify-center 
            font-bold shadow-sm
          "
          title={user?.email}
        >
          {getInitials(user)}
        </div>

        <button
          onClick={handleLogout}
          className="btn-icon hover:text-red-500 transition"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* --------------------------------------------------
          TITLE
      -------------------------------------------------- */}
      <div className="px-4 pb-2 pt-1 text-lg font-semibold text-gray-700 dark:text-gray-200">
        🚛 TMS System
      </div>

      {isLoading && (
        <div className="px-4 py-2 text-gray-500 text-sm">Loading...</div>
      )}

      {/* --------------------------------------------------
          NAVIGATION SECTIONS
      -------------------------------------------------- */}
      <div className="sidebar-content flex-1 overflow-y-auto px-2 mt-2">
        {navLinksConfig.map((section) => (
          <div key={section.title} className="mb-5">

            <div className="
              flex items-center gap-2 
              px-3 py-1.5 
              text-xs font-semibold tracking-wide uppercase
              text-gray-500 dark:text-gray-400
            ">
              {section.icon}
              <span>{section.title}</span>
            </div>

            {section.links
              .filter((l) => l.roles.includes(user?.role))
              .map((link) => {
                const isActive = currentView === link.view;

                return (
                  <button
                    key={link.view}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 rounded-md my-1
                      text-left transition-colors
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                    onClick={() => handleViewChange(link.view)}
                    disabled={isLoading}
                    title={link.label}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;
