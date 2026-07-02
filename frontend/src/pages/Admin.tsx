import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Users,
  Building2,
  Siren,
  AlertTriangle,
  Plug,
  Crown,
  ChevronRight,
  X,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import type { AdminOrg, AdminUser } from '../types';

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── Mini bar chart from signup trend ────────────────────────────────────────
function SignupChart({ data }: { data: Array<{ day: string; count: number }> }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-brand-light" />
        <h2 className="text-sm font-semibold text-white">New Signups (last 14 days)</h2>
      </div>
      <div className="flex items-end gap-1 h-16">
        {data.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${format(new Date(d.day), 'MMM d')}: ${d.count}`}>
            <div
              className="w-full bg-brand/60 hover:bg-brand rounded transition-colors"
              style={{ height: `${Math.max((d.count / max) * 52, d.count > 0 ? 4 : 0)}px` }}
            />
            <span className="text-slate-600 text-xs" style={{ fontSize: '9px' }}>
              {format(new Date(d.day), 'd')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Org detail drawer ────────────────────────────────────────────────────────
function OrgDrawer({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-org', orgId],
    queryFn: () => adminApi.organizationDetail(orgId),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-surface-card border-l border-surface-border overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border sticky top-0 bg-surface-card">
          <h2 className="text-white font-semibold">{data?.org?.name ?? 'Workspace'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data ? null : (
          <div className="p-5 space-y-5">
            {/* Org info */}
            <div className="space-y-1 text-sm">
              <p className="text-slate-500 text-xs">Slug</p>
              <p className="text-white font-mono">{data.org.slug}</p>
              <p className="text-slate-500 text-xs mt-2">Created</p>
              <p className="text-white">{format(new Date(data.org.createdAt), 'PPP')}</p>
            </div>

            {/* Members */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Members ({data.members.length})</p>
              <div className="space-y-1">
                {data.members.map((m: { id: string; name: string; email: string; role: string; joinedAt: string }) => (
                  <div key={m.id} className="flex items-center gap-2 py-1.5 px-3 bg-surface rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-xs text-brand-light font-bold flex-shrink-0">
                      {m.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{m.name}</p>
                      <p className="text-slate-500 text-xs truncate">{m.email}</p>
                    </div>
                    <Badge variant={m.role === 'owner' ? 'critical' : m.role === 'admin' ? 'grouped' : 'pending'}>
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations */}
            {data.integrations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Integrations ({data.integrations.length})</p>
                <div className="space-y-1">
                  {data.integrations.map((i: { id: string; type: string; externalId: string }) => (
                    <div key={i.id} className="flex items-center gap-2 py-1.5 px-3 bg-surface rounded-lg">
                      <span className="text-sm">{i.type === 'datadog' ? '🐶' : '☁️'}</span>
                      <p className="text-white text-xs capitalize">{i.type}</p>
                      <p className="text-slate-500 text-xs ml-auto font-mono">{i.externalId}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent incidents */}
            {data.recentIncidents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Recent Incidents</p>
                <div className="space-y-1">
                  {data.recentIncidents.slice(0, 5).map((inc: { id: string; title: string; status: string; alertCount: number; createdAt: string }) => (
                    <div key={inc.id} className="flex items-center gap-2 py-1.5 px-3 bg-surface rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate">{inc.title}</p>
                        <p className="text-slate-500 text-xs">{formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}</p>
                      </div>
                      <Badge variant={inc.status as 'active' | 'investigating' | 'resolved'}>{inc.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'orgs' | 'users';

export default function Admin() {
  const { isSuperAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminApi.overview,
    enabled: isSuperAdmin,
    refetchInterval: 60_000,
  });

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: adminApi.organizations,
    enabled: isSuperAdmin && tab === 'orgs',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.users,
    enabled: isSuperAdmin && tab === 'users',
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-surface-card border border-red-500/20 rounded-xl p-12 text-center">
          <Crown className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Platform Admin Only</p>
          <p className="text-slate-500 text-sm">This page is restricted to the platform founder.</p>
        </div>
      </div>
    );
  }

  const filteredOrgs = (orgs ?? []).filter(
    (o: AdminOrg) =>
      o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      o.slug.toLowerCase().includes(orgSearch.toLowerCase()),
  );

  const filteredUsers = (users ?? []).filter(
    (u: AdminUser) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
          <Crown className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Platform Admin</h1>
          <p className="text-slate-400 text-xs">Signed in as {user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 w-fit">
        {([
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'orgs', label: 'Workspaces', icon: Building2 },
          { id: 'users', label: 'Users', icon: Users },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-surface-card text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Total Users" value={overview.totals.users} icon={Users} accent="bg-brand/80" />
                <StatCard label="Workspaces" value={overview.totals.organizations} icon={Building2} accent="bg-purple-500/80" />
                <StatCard label="Total Incidents" value={overview.totals.incidents} icon={Siren} accent="bg-red-500/80"
                  sub={`${overview.totals.activeIncidents} active`} />
                <StatCard label="Total Alerts" value={overview.totals.alerts} icon={AlertTriangle} accent="bg-orange-500/80" />
                <StatCard label="Integrations" value={overview.totals.integrations} icon={Plug} accent="bg-green-500/80"
                  sub="Datadog + CloudWatch" />
                <StatCard label="Active Incidents" value={overview.totals.activeIncidents} icon={Activity} accent="bg-yellow-500/80" />
              </div>
              <SignupChart data={overview.signupTrend} />
            </>
          ) : null}
        </div>
      )}

      {/* ── Workspaces tab ── */}
      {tab === 'orgs' && (
        <div className="space-y-4">
          <input
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            placeholder="Search workspaces…"
            className="w-full max-w-sm bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
          />
          {orgsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Workspace', 'Members', 'Incidents', 'Alerts', 'Integrations', 'Created', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgs.map((org: AdminOrg) => (
                    <tr
                      key={org.id}
                      onClick={() => setSelectedOrg(org.id)}
                      className="border-b border-surface-border last:border-0 hover:bg-surface-hover cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{org.name}</p>
                        <p className="text-slate-500 text-xs font-mono">{org.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{org.memberCount}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{org.incidentCount}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{org.alertCount}</td>
                      <td className="px-4 py-3">
                        {org.integrationCount > 0 ? (
                          <span className="text-green-400 text-sm">{org.integrationCount}</span>
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto" />
                      </td>
                    </tr>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">No workspaces found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full max-w-sm bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
          />
          {usersLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['User', 'Workspaces', 'Role(s)', 'Joined'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: AdminUser) => (
                    <tr key={u.id} className="border-b border-surface-border last:border-0 hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand-light text-xs font-bold flex-shrink-0">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{u.name}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {u.organizations.map((o) => (
                            <p key={o.id} className="text-slate-300 text-xs">{o.name}</p>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.organizations.map((o) => (
                            <Badge
                              key={o.id}
                              variant={o.role === 'owner' ? 'critical' : o.role === 'admin' ? 'grouped' : 'pending'}
                            >
                              {o.role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500 text-sm">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Org detail drawer */}
      {selectedOrg && <OrgDrawer orgId={selectedOrg} onClose={() => setSelectedOrg(null)} />}
    </div>
  );
}
