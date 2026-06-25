import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Siren,
  Settings,
  LogOut,
  Zap,
  Plug,
  Crown,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

function navItems(role: string) {
  const base = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/incidents', icon: Siren, label: 'Incidents' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  ];
  if (role === 'owner' || role === 'admin') {
    base.push({ to: '/integrations', icon: Plug, label: 'Integrations' });
  }
  base.push({ to: '/settings', icon: Settings, label: 'Settings' });
  return base;
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'owner') {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/25 rounded text-yellow-400 text-xs font-medium">
        <Crown className="w-3 h-3" /> Owner
      </div>
    );
  }
  if (role === 'admin') {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/25 rounded text-blue-400 text-xs font-medium">
        <Shield className="w-3 h-3" /> Admin
      </div>
    );
  }
  return (
    <span className="text-xs text-slate-600 capitalize">{role}</span>
  );
}

export default function Sidebar() {
  const { organization, user, logout } = useAuth();
  const items = navItems(user?.role ?? 'member');

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
        {items.map(({ to, icon: Icon, label }) => (
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
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-white text-xs font-medium truncate flex-1">{user?.name ?? user?.email}</p>
          </div>
          <RoleBadge role={user?.role ?? 'member'} />
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
