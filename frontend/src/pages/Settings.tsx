import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Slack,
  Users,
  User,
  Trash2,
  Plus,
  CheckCircle,
  Crown,
  Shield,
  Copy,
  Info,
} from 'lucide-react';
import { orgApi } from '../api/org';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { OrgMember } from '../types';

const TABS = [
  { id: 'slack', label: 'Slack Setup', icon: Slack },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'account', label: 'My Account', icon: User },
] as const;

type Tab = (typeof TABS)[number]['id'];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white border border-surface-border hover:border-slate-500 rounded transition-colors"
    >
      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'owner') return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
  if (role === 'admin') return <Shield className="w-3.5 h-3.5 text-blue-400" />;
  return null;
}

function SlackTab() {
  const { user, organization } = useAuth();
  const qc = useQueryClient();
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      orgApi.updateSettings(organization!.id, {
        defaultSlackChannelId: channelId.trim(),
        defaultSlackChannelName: channelName.trim() || undefined,
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      qc.invalidateQueries({ queryKey: ['org-settings'] });
    },
  });

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-white font-semibold mb-1">Slack Notifications</h2>
        <p className="text-slate-400 text-sm">
          Set the Slack channel where OpsPilot will post incident alerts and AI analysis.
        </p>
      </div>

      {/* How to find channel ID */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
          <Info className="w-4 h-4" />
          How to find your Slack channel ID
        </div>
        <ol className="text-slate-300 text-xs space-y-1 list-decimal list-inside">
          <li>Open Slack and right-click the channel name in the sidebar</li>
          <li>Click <strong>"View channel details"</strong></li>
          <li>Scroll to the bottom — the Channel ID looks like <code className="bg-black/30 px-1 rounded">C0B5WTNFNF5</code></li>
          <li>Or copy it from the channel URL: <code className="bg-black/30 px-1 rounded">slack.com/archives/C0B5WTNFNF5</code></li>
        </ol>
      </div>

      {isAdminOrOwner ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Channel ID <span className="text-red-400">*</span>
            </label>
            <input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="C0B5WTNFNF5"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand font-mono"
            />
            <p className="text-slate-500 text-xs mt-1">Starts with C — found in channel details or URL</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Channel name (optional)</label>
            <input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="incidents"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {/* Bot permissions reminder */}
          <div className="bg-surface-border/40 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium mb-1">Required Slack bot permissions</p>
            <div className="flex flex-wrap gap-1.5">
              {['chat:write', 'app_mentions:read', 'channels:history'].map((s) => (
                <code key={s} className="bg-black/30 text-xs px-2 py-0.5 rounded text-slate-300">{s}</code>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Make sure your Slack bot is invited to the channel with <code>/invite @YourBot</code>
            </p>
          </div>

          <button
            onClick={() => save.mutate()}
            disabled={!channelId.trim() || save.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {save.isPending ? (
              <Spinner size="sm" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Slack className="w-4 h-4" />
            )}
            {saved ? 'Saved!' : 'Save Slack channel'}
          </button>
        </div>
      ) : (
        <div className="text-slate-400 text-sm p-4 bg-surface rounded-lg border border-surface-border">
          Only workspace owners and admins can configure Slack notifications.
        </div>
      )}
    </div>
  );
}

function MembersTab() {
  const { user, organization } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [inviteError, setInviteError] = useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', organization?.id],
    queryFn: () => orgApi.listMembers(organization!.id),
    enabled: !!organization?.id,
  });

  const addMember = useMutation({
    mutationFn: () => orgApi.addMember(organization!.id, email.trim(), role),
    onSuccess: () => {
      setEmail('');
      setInviteError('');
      qc.invalidateQueries({ queryKey: ['members', organization?.id] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setInviteError(typeof msg === 'string' ? msg : 'Failed to add member');
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => orgApi.removeMember(organization!.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', organization?.id] }),
  });

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError('');
    if (!email.trim()) return;
    addMember.mutate();
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-white font-semibold mb-1">Team Members</h2>
        <p className="text-slate-400 text-sm">
          Manage who has access to your OpsPilot workspace.
        </p>
      </div>

      {/* Add member (admin/owner only) */}
      {isOwnerOrAdmin && (
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-sm font-medium text-white mb-3">Invite a team member</p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
            <p className="text-blue-300 text-xs">
              The person must <strong>register an account first</strong> at{' '}
              <span className="font-mono bg-black/30 px-1 rounded">
                {window.location.origin}/register
              </span>
              <CopyButton text={`${window.location.origin}/register`} />
              {' '}then you can add them here by email.
            </p>
          </div>
          {inviteError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {inviteError}
            </div>
          )}
          <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 min-w-48 bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={!email.trim() || addMember.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {addMember.isPending ? 'Adding…' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Member list */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Member</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Role</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Joined</th>
                {isOwnerOrAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m: OrgMember) => (
                <tr key={m.id} className="border-b border-surface-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand-light text-xs font-bold">
                        {m.user?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-white text-sm">{m.user?.name}</p>
                        <p className="text-slate-500 text-xs">{m.user?.email}</p>
                      </div>
                      {m.userId === user?.id && (
                        <span className="text-xs text-slate-600">(you)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <RoleIcon role={m.role} />
                      <Badge
                        variant={m.role === 'owner' ? 'critical' : m.role === 'admin' ? 'grouped' : 'pending'}
                      >
                        {m.role}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  {isOwnerOrAdmin && (
                    <td className="px-4 py-3 text-right">
                      {m.role !== 'owner' && m.userId !== user?.id && (
                        <button
                          onClick={() => removeMember.mutate(m.userId)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role guide */}
      <div className="bg-surface rounded-xl border border-surface-border p-4">
        <p className="text-xs font-medium text-white mb-2">Role permissions</p>
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <strong className="text-white">Owner</strong> — full access, manage billing, delete workspace
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <strong className="text-white">Admin</strong> — manage members, integrations, Slack settings
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-white">Member</strong> — view dashboard, manage incidents and alerts
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab() {
  const { user, organization } = useAuth();

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h2 className="text-white font-semibold mb-1">My Account</h2>
        <p className="text-slate-400 text-sm">Your personal account details.</p>
      </div>
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand-light text-lg font-bold">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <RoleIcon role={user?.role ?? 'member'} />
              <span className="capitalize text-xs text-slate-400">{user?.role}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-surface-border pt-4 space-y-2">
          {[
            { label: 'Workspace', value: organization?.name },
            { label: 'Workspace slug', value: organization?.slug },
            { label: 'User ID', value: user?.id },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-slate-500 text-xs">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-mono">{value}</span>
                {value && <CopyButton text={value} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === '1';
  const [activeTab, setActiveTab] = useState<Tab>(isOnboarding ? 'slack' : 'slack');
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Onboarding banner */}
      {isOnboarding && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 font-semibold mb-1">
            <CheckCircle className="w-5 h-5" /> Workspace created successfully!
          </div>
          <p className="text-slate-300 text-sm">
            Complete the steps below to start receiving AI-powered incident alerts.
            Set up Slack first, then go to <strong>Integrations</strong> to connect Datadog or CloudWatch.
          </p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Configure your workspace, notifications, and team access.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Tab nav */}
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === id
                    ? 'bg-brand/15 text-brand-light font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Admin badge */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <div className="mt-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium">
                <Crown className="w-3.5 h-3.5" />
                {user.role === 'owner' ? 'Workspace Owner' : 'Admin'}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">Full access to all settings</p>
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'slack' && <SlackTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'account' && <AccountTab />}
        </div>
      </div>
    </div>
  );
}
