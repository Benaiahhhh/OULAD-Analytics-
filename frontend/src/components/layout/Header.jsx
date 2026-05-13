import { useLocation } from 'react-router-dom';
import { Activity, Menu } from 'lucide-react';

const TITLES = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/predictions': 'Predictions',
};

export default function Header({ onMenuToggle }) {
  const location = useLocation();
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = TITLES[basePath] || 'Student Detail';

  return (
    <header className="h-14 sm:h-16 border-b border-brand-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible below lg */}
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-semibold text-brand-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Model status indicator — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>Model v1.0 · AUC 0.877</span>
        </div>
      </div>
    </header>
  );
}
