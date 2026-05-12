import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  GraduationCap,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/predictions', icon: BrainCircuit, label: 'Predictions' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 flex flex-col bg-brand-900 text-brand-200 transition-all duration-300 z-30',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-brand-800">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-brand-100" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
              OULAD Analytics
            </span>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-700/60 text-white shadow-sm'
                  : 'text-brand-300 hover:bg-brand-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-brand-800 p-3">
        <div className={clsx('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-200 flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-brand-400 truncate">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-brand-400 hover:text-white hover:bg-brand-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-brand-700 border-2 border-brand-50 flex items-center justify-center shadow-md hover:bg-brand-600 transition-colors"
      >
        <ChevronLeft
          className={clsx(
            'w-3.5 h-3.5 text-white transition-transform',
            collapsed && 'rotate-180'
          )}
        />
      </button>
    </aside>
  );
}
