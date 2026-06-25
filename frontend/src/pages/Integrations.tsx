import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, CheckCircle, ExternalLink, AlertTriangle, Zap } from 'lucide-react';
import { integrationsApi } from '../api/integrations';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { Integration } from '../types';

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
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-white border border-surface-border hover:border-slate-500 rounded-lg transition-colors flex-shrink-0"
        >
          {copied ? (
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

const SETUP_GUIDES: Record<string, { steps: string[]; docsUrl: string }> = {
  datadog: {
    docsUrl: 'https://docs.datadoghq.com/integrations/webhooks/',
    steps: [
      'In Datadog, go to Integrations → Webhooks',
      'Click "+ New" and paste the Webhook URL above',
      'Add a custom header: X-OpsPilot-Webhook-Secret = [your secret]',
      'Select the monitors you want to send alerts from',
      'Save and test with any firing monitor',
    ],
  },
  cloudwatch: {
    docsUrl: 'https://docs.aws.amazon.com/sns/latest/dg/sns-http-https-endpoint-as-subscriber.html',
    steps: [
      'In AWS, create an SNS Topic (or use an existing one)',
      'Add an HTTPS subscription pointing to the Webhook URL above',
      'In your CloudWatch alarm, set SNS Topic as the alarm action',
      'Add X-OpsPilot-Webhook-Secret as a header in the SNS subscription',
      'Confirm the subscription email from AWS',
    ],
  },
};

function IntegrationCard({
  integration,
}: {
  integration: Integration & { webhookUrl?: string; webhookSecret?: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const guide = SETUP_GUIDES[integration.type];

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-brand-light" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium capitalize">{integration.type}</p>
          <p className="text-slate-500 text-xs font-mono truncate">{integration.externalId}</p>
        </div>
        <Badge variant={integration.type}>{integration.type}</Badge>
        <span className="text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-border space-y-4 pt-4">
          {integration.webhookUrl && (
            <CopyField label="Webhook URL (paste this into Datadog/CloudWatch)" value={integration.webhookUrl} />
          )}
          {integration.webhookSecret && (
            <CopyField label="Webhook Secret (X-OpsPilot-Webhook-Secret header)" value={integration.webhookSecret} />
          )}

          {guide && (
            <div className="bg-surface rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-white">Setup guide</p>
              <ol className="space-y-1">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-brand-light font-medium flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <a
                href={guide.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-light hover:underline mt-1"
              >
                Official docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <p className="text-slate-600 text-xs">
            Created {new Date(integration.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

function CreateIntegrationModal({
  orgId,
  onClose,
}: {
  orgId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<'datadog' | 'cloudwatch'>('datadog');
  const [externalId, setExternalId] = useState('');
  const [created, setCreated] = useState<(Integration & { webhookUrl: string; webhookSecret: string }) | null>(null);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => integrationsApi.create(orgId, { type, externalId: externalId.trim() || type }),
    onSuccess: (data) => {
      setCreated(data);
      qc.invalidateQueries({ queryKey: ['integrations', orgId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Failed to create integration');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-white font-semibold">New Integration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">×</button>
        </div>

        <div className="p-5">
          {created ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <CheckCircle className="w-5 h-5" />
                Integration created!
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Save these credentials now — the secret won't be shown again.
              </div>
              <CopyField label="Webhook URL" value={created.webhookUrl} />
              <CopyField label="Webhook Secret" value={created.webhookSecret} />
              <button
                onClick={onClose}
                className="w-full py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">Integration type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['datadog', 'cloudwatch'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-3 py-2.5 rounded-lg border text-sm capitalize font-medium transition-colors ${
                        type === t
                          ? 'border-brand bg-brand/15 text-brand-light'
                          : 'border-surface-border text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {t === 'datadog' ? '🐶 Datadog' : '☁️ CloudWatch'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Name / identifier</label>
                <input
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  placeholder={type === 'datadog' ? 'datadog-prod' : 'cloudwatch-prod'}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-brand"
                />
                <p className="text-slate-500 text-xs mt-1">A label to identify this integration</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 border border-surface-border text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                  className="flex-1 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {create.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Integrations() {
  const { user, organization } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations', organization?.id],
    queryFn: () => integrationsApi.list(organization!.id),
    enabled: !!organization?.id,
  });

  if (!isAdminOrOwner) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-2">Integrations</h1>
        <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center text-slate-400">
          Only workspace owners and admins can manage integrations.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Connect alert sources. Each integration gets a unique webhook URL for Datadog or CloudWatch.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New integration
        </button>
      </div>

      {/* How it works */}
      <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-6">
        <p className="text-brand-light text-sm font-medium mb-2">How webhook integrations work</p>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-white font-medium mb-1">1. Create integration</p>
            OpsPilot generates a unique webhook URL and secret for you.
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-white font-medium mb-1">2. Configure your tool</p>
            Paste the webhook URL into Datadog or CloudWatch. Add the secret as a header.
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-white font-medium mb-1">3. Alerts flow in</p>
            OpsPilot receives, deduplicates, groups, and analyzes alerts automatically.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : integrations?.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-xl py-16 text-center">
          <Zap className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">No integrations yet</p>
          <p className="text-slate-500 text-xs">Click "New integration" to connect Datadog or CloudWatch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(integrations ?? []).map((i: Integration) => (
            <IntegrationCard key={i.id} integration={i} />
          ))}
        </div>
      )}

      {showCreate && organization && (
        <CreateIntegrationModal
          orgId={organization.id}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
