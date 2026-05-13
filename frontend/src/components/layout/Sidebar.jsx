import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  GraduationCap,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/predictions', icon: BrainCircuit, label: 'Predictions' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const sidebarContent = (
    <>
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

        {/* Mobile close button — only visible in drawer mode */}
        <button
          onClick={onMobileClose}
          className="ml-auto p-1.5 rounded-lg hover:bg-brand-800 text-brand-300 lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
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
              onClick={onMobileClose}          /* close drawer on navigate */
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

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:block border-t border-brand-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-brand-400 hover:text-white hover:bg-brand-800 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={clsx(
              'w-4 h-4 transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* User section */}
      <div className="border-t border-brand-800 p-3">
        <div className={clsx('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-200 flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-brand-400 truncate">{user?.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={clsx(
              'p-1.5 rounded-lg text-brand-400 hover:text-red-400 hover:bg-brand-800 transition-colors',
              collapsed && 'mt-2'
            )}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg+) ───────────────────────────────── */}
      <aside
        className={clsx(
          'hidden lg:flex h-screen sticky top-0 flex-col bg-brand-900 text-brand-200 transition-all duration-300 z-30',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── MOBILE DRAWER (<lg) ─────────────────────────────────── */}
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-brand-900 text-brand-200 z-50 flex flex-col lg:hidden transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
