import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plug,
} from 'lucide-react';
import { integrationsApi } from '../api/integrations';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import type { Integration } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────
type IntegrationType = 'slack' | 'datadog' | 'cloudwatch' | 'grafana' | 'pagerduty';

interface IntegrationDef {
  type: IntegrationType;
  label: string;
  description: string;
  icon: string;
  available: boolean;
  docsUrl?: string;
  setupSteps?: string[];
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    type: 'slack',
    label: 'Slack',
    description: 'Receive AI incident summaries and take actions directly in Slack.',
    icon: '💬',
    available: true,
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    setupSteps: [
      'Go to Settings → Slack Setup tab',
      'Enter your Slack channel ID',
      'Make sure the bot is invited with /invite @OpsPilot',
    ],
  },
  {
    type: 'datadog',
    label: 'Datadog',
    description: 'Forward monitor alerts to OpsPilot for AI-powered deduplication and triage.',
    icon: '🐶',
    available: true,
    docsUrl: 'https://docs.datadoghq.com/integrations/webhooks/',
    setupSteps: [
      'Go to Datadog → Integrations → Webhooks',
      'Click "+ New" and paste your Webhook URL',
      'Add header: X-OpsPilot-Webhook-Secret = your secret',
      'Select the monitors to send alerts from',
    ],
  },
  {
    type: 'cloudwatch',
    label: 'CloudWatch',
    description: 'Connect AWS CloudWatch alarms via SNS to trigger AI incident analysis.',
    icon: '☁️',
    available: true,
    docsUrl: 'https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html',
    setupSteps: [
      'Create or reuse an SNS Topic in AWS',
      'Add HTTPS subscription pointing to the Webhook URL',
      'Set SNS Topic as your CloudWatch alarm action',
      'Add X-OpsPilot-Webhook-Secret header to the subscription',
    ],
  },
  {
    type: 'grafana',
    label: 'Grafana',
    description: 'Connect Grafana alert rules for unified incident management.',
    icon: '📊',
    available: false,
  },
  {
    type: 'pagerduty',
    label: 'PagerDuty',
    description: 'Sync PagerDuty incidents with OpsPilot for cross-platform visibility.',
    icon: '📟',
    available: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-black/40 border border-surface-border rounded-lg px-3 py-2 text-xs text-green-400 font-mono overflow-x-auto whitespace-nowrap">
          {value}
        </code>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-white border border-surface-border rounded-lg transition-colors flex-shrink-0"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────
function CreateModal({
  orgId,
  defaultType,
  onClose,
}: {
  orgId: string;
  defaultType: IntegrationType;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<'datadog' | 'cloudwatch'>(
    defaultType === 'cloudwatch' ? 'cloudwatch' : 'datadog',
  );
  const [externalId, setExternalId] = useState('');
  const [created, setCreated] = useState<(Integration & { webhookUrl: string; webhookSecret: string }) | null>(null);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => integrationsApi.create(orgId, { type, externalId: externalId.trim() || type }),
    onSuccess: (data) => { setCreated(data); qc.invalidateQueries({ queryKey: ['integrations', orgId] }); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Failed to create integration');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-white font-semibold">Connect {INTEGRATION_DEFS.find(d => d.type === type)?.label}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {created ? (
            <>
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <CheckCircle className="w-5 h-5" /> Integration connected!
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Save these credentials now — the secret is only shown once.
              </div>
              <CopyField label="Webhook URL" value={created.webhookUrl} />
              <CopyField label="Webhook Secret (X-OpsPilot-Webhook-Secret header)" value={created.webhookSecret} />
              <button onClick={onClose} className="w-full py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors">
                Done
              </button>
            </>
          ) : (
            <>
              {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Integration type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['datadog', 'cloudwatch'] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${type === t ? 'border-brand bg-brand/15 text-brand-light' : 'border-surface-border text-slate-400 hover:border-slate-500'}`}
                    >
                      {t === 'datadog' ? '🐶 Datadog' : '☁️ CloudWatch'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name / identifier</label>
                <input value={externalId} onChange={(e) => setExternalId(e.target.value)}
                  placeholder={type === 'datadog' ? 'datadog-prod' : 'cloudwatch-prod'}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 border border-surface-border text-slate-400 hover:text-white rounded-lg text-sm transition-colors">Cancel</button>
                <button onClick={() => create.mutate()} disabled={create.isPending}
                  className="flex-1 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                  {create.isPending ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single integration card ──────────────────────────────────────────────────
function IntegrationCard({
  def,
  connected,
  onConnect,
  canManage,
}: {
  def: IntegrationDef;
  connected: Integration[];
  onConnect: (type: IntegrationType) => void;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isConnected = connected.length > 0;
  const isComingSoon = !def.available;

  return (
    <div className={`bg-surface-card border rounded-xl overflow-hidden transition-colors ${isConnected ? 'border-green-500/30' : 'border-surface-border'}`}>
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isConnected ? 'bg-green-500/10' : 'bg-surface'}`}>
          {def.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-semibold text-sm">{def.label}</p>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <CheckCircle className="w-3 h-3" /> Connected ({connected.length})
              </span>
            )}
            {isComingSoon && (
              <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-500 text-xs rounded font-medium">Coming soon</span>
            )}
          </div>
          <p className="text-slate-500 text-xs">{def.description}</p>
        </div>
        <div className="flex-shrink-0">
          {isComingSoon ? (
            <button disabled className="px-3 py-1.5 border border-surface-border text-slate-600 text-xs rounded-lg cursor-not-allowed">
              Soon
            </button>
          ) : def.type === 'slack' ? (
            canManage ? (
              <a href="/settings" className="px-3 py-1.5 border border-surface-border text-slate-300 hover:text-white text-xs rounded-lg transition-colors">
                {isConnected ? 'Settings' : 'Configure →'}
              </a>
            ) : isConnected ? (
              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            ) : null
          ) : isConnected ? (
            <button
              onClick={() => setExpanded((x) => !x)}
              className="flex items-center gap-1 px-3 py-1.5 border border-surface-border text-slate-300 hover:text-white text-xs rounded-lg transition-colors"
            >
              Details {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : canManage ? (
            <button
              onClick={() => onConnect(def.type)}
              className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-medium rounded-lg transition-colors"
            >
              Connect
            </button>
          ) : (
            <span className="text-xs text-slate-600">Not connected</span>
          )}
        </div>
      </div>

      {/* Expanded details for existing connections */}
      {expanded && isConnected && connected.map((c) => (
        <div key={c.id} className="border-t border-surface-border px-5 py-4 space-y-2">
          <p className="text-xs text-slate-500 font-mono">{c.externalId}</p>
          <p className="text-slate-600 text-xs">Connected {new Date(c.createdAt).toLocaleDateString()}</p>
          {def.setupSteps && (
            <div className="bg-surface rounded-lg p-3 space-y-1 mt-2">
              <p className="text-xs font-medium text-white mb-1.5">Setup reminder</p>
              {def.setupSteps.map((step, i) => (
                <p key={i} className="text-xs text-slate-400"><span className="text-brand-light">{i + 1}.</span> {step}</p>
              ))}
              {def.docsUrl && (
                <a href={def.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-light hover:underline mt-1">
                  Official docs <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Setup steps for unconnected */}
      {!isConnected && !isComingSoon && def.setupSteps && def.type !== 'slack' && (
        <div className="border-t border-surface-border px-5 py-3">
          <p className="text-xs text-slate-600 mb-1">After connecting, you'll configure:</p>
          <ol className="space-y-0.5">
            {def.setupSteps.slice(0, 2).map((step, i) => (
              <li key={i} className="text-xs text-slate-500"><span className="text-slate-600">{i + 1}.</span> {step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Integrations() {
  const { user, organization } = useAuth();
  const [createType, setCreateType] = useState<IntegrationType | null>(null);

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', organization?.id],
    queryFn: () => integrationsApi.list(organization!.id),
    enabled: !!organization?.id,
  });

  // members can view but not manage

  const connectedByType = (type: string) =>
    (integrations ?? []).filter((i: Integration) => i.type === type);

  const totalConnected = (integrations ?? []).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {isAdminOrOwner
              ? 'Connect alert sources to start receiving AI-powered incident analysis.'
              : 'View connected alert sources. Ask an owner or admin to connect new integrations.'}
          </p>
        </div>
        {totalConnected > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Plug className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-medium">{totalConnected} connected</span>
          </div>
        )}
      </div>

      {/* How it works */}
      {isAdminOrOwner && totalConnected === 0 && (
        <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-6">
          <p className="text-brand-light text-sm font-medium mb-2">How it works</p>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-400">
            {[
              { n: '1', title: 'Connect', body: 'Choose an alert source. We generate a unique webhook URL.' },
              { n: '2', title: 'Configure', body: 'Paste the webhook URL into Datadog or CloudWatch.' },
              { n: '3', title: 'Analyze', body: 'OpsPilot deduplicates, groups, and runs AI analysis automatically.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="bg-black/20 rounded-lg p-3">
                <p className="text-white font-medium mb-1">{n}. {title}</p>
                {body}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration cards */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {INTEGRATION_DEFS.map((def) => (
            <IntegrationCard
              key={def.type}
              def={def}
              connected={connectedByType(def.type)}
              onConnect={setCreateType}
              canManage={isAdminOrOwner}
            />
          ))}
        </div>
      )}

      {/* Create modal — admins/owners only */}
      {createType && organization && isAdminOrOwner && (
        <CreateModal
          orgId={organization.id}
          defaultType={createType}
          onClose={() => setCreateType(null)}
        />
      )}
    </div>
  );
}
