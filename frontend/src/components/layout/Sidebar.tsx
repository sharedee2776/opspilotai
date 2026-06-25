import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Siren,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/incidents', icon: Siren, label: 'Incidents' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
];

export default function Sidebar() {
  const { organization, user, logout } = useAuth();

  return (
    <aside className="w-56 flex-shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none">OpsPilot</p>
            <p className="text-slate-500 text-xs mt-0.5 truncate">{organization?.name ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand/15 text-brand-light font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-surface-hover'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-surface-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-xs font-medium truncate">{user?.email}</p>
          <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-400 hover:text-white hover:bg-surface-hover rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
