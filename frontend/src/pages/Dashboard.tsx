import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { metricsApi } from '../api/metrics';
import { incidentsApi } from '../api/incidents';
import { integrationsApi } from '../api/integrations';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { Incident } from '../types';
import {
  AlertTriangle,
  Siren,
  TrendingDown,
  Layers,
  ArrowRight,
  Plug,
  CheckCircle,
  Zap,
  ChevronRight,
} from 'lucide-react';

// ─── Demo incident shown when no real data ───────────────────────────────────
function DemoIncidentBanner() {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden mb-8">
      <div className="px-5 py-3 border-b border-surface-border flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <p className="text-xs text-yellow-400 font-medium">Sample Incident — Connect an integration to see real data</p>
      </div>
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="critical">critical</Badge>
            <span className="text-slate-400 text-xs">payments-api</span>
            <span className="text-slate-600 text-xs">• 4 minutes ago</span>
          </div>
          <h3 className="text-white font-semibold text-sm mb-2">Database connection pool exhausted</h3>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs font-medium text-slate-400 mb-1">AI Root Cause</p>
              <p className="text-slate-300 text-xs">Connection pool reached max capacity (100/100) after deploy v2.4.1 introduced N+1 queries in the order fulfillment flow.</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs font-medium text-slate-400 mb-2">Suggested Fixes</p>
              <ul className="space-y-1">
                {['Restart payments-api pods', 'Increase pool size to 200', 'Review recent deployment'].map((fix) => (
                  <li key={fix} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {fix}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-slate-600 text-xs">8 alerts grouped</p>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state when no incidents ───────────────────────────────────────────
function EmptyIncidents({ hasIntegrations }: { hasIntegrations: boolean }) {
  return (
    <div className="py-14 text-center px-8">
      <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
        <Siren className="w-6 h-6 text-brand-light" />
      </div>
      <p className="text-white font-medium mb-1">No incidents yet</p>
      {hasIntegrations ? (
        <p className="text-slate-500 text-sm">Incidents will appear here when alerts are grouped by OpsPilot.</p>
      ) : (
        <>
          <p className="text-slate-500 text-sm mb-4">Connect Datadog or CloudWatch to start receiving AI-analyzed incidents.</p>
          <Link
            to="/integrations"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plug className="w-4 h-4" /> Connect integration
          </Link>
        </>
      )}
    </div>
  );
}

// ─── Metric card with trend ───────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'down' ? 'text-green-400' : trend === 'up' ? 'text-red-400' : 'text-slate-500';
  const trendArrow = trend === 'down' ? '↓' : trend === 'up' ? '↑' : '';

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-white leading-none">{value}</p>
        {trend && trend !== 'neutral' && (
          <span className={`text-sm font-medium mb-0.5 ${trendColor}`}>{trendArrow}</span>
        )}
      </div>
      {sub && <p className={`text-xs mt-1 ${trendColor}`}>{sub}</p>}
    </div>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  const navigate = useNavigate();
  return (
    <tr
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="border-b border-surface-border hover:bg-surface-hover cursor-pointer transition-colors group"
    >
      <td className="px-4 py-3">
        <p className="text-white text-sm font-medium truncate max-w-xs group-hover:text-brand-light transition-colors">
          {incident.title}
        </p>
        <p className="text-slate-500 text-xs mt-0.5">{incident.service}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant={incident.status}>{incident.status}</Badge>
      </td>
      <td className="px-4 py-3 text-slate-400 text-sm">{incident.alertCount}</td>
      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
        {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
      </td>
      <td className="px-4 py-3 text-right">
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors ml-auto" />
      </td>
    </tr>
  );
}

// ─── Pipeline activity bar ────────────────────────────────────────────────────
function PipelineBar({ noiseReduction, pipeline }: {
  noiseReduction: number;
  pipeline: { alertsReceived: number; duplicatesSkipped: number; alertsStored: number; incidentsCreated: number };
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Pipeline Activity</h2>
        <span className="text-xs text-green-400 font-medium">{noiseReduction}% noise reduction</span>
      </div>

      {/* Flow steps */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {[
          { label: 'Received', value: pipeline.alertsReceived, color: 'bg-orange-500' },
          { label: 'Deduped', value: pipeline.duplicatesSkipped, color: 'bg-yellow-500' },
          { label: 'Stored', value: pipeline.alertsStored, color: 'bg-blue-500' },
          { label: 'Incidents', value: pipeline.incidentsCreated, color: 'bg-brand' },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} className="flex items-center gap-1 flex-shrink-0">
            <div className="text-center">
              <div className={`w-10 h-10 rounded-lg ${color}/20 border border-${color.replace('bg-', '')}/30 flex items-center justify-center mx-auto mb-1`}>
                <span className="text-xs font-bold text-white">{value}</span>
              </div>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
            {i < arr.length - 1 && (
              <ArrowRight className="w-3 h-3 text-slate-700 flex-shrink-0 mb-4" />
            )}
          </div>
        ))}
      </div>

      {/* Noise reduction bar */}
      <div>
        <div className="bg-surface rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(noiseReduction, 100)}%` }}
          />
        </div>
        <p className="text-slate-600 text-xs mt-1">
          {pipeline.duplicatesSkipped} duplicate alerts suppressed, {pipeline.alertsStored} unique alerts stored
        </p>
      </div>
    </div>
  );
}

// ─── Setup checklist (shown when new workspace) ───────────────────────────────
function SetupChecklist({ hasIntegrations, slackConfigured }: { hasIntegrations: boolean; slackConfigured: boolean }) {
  const steps = [
    { label: 'Create workspace', done: true },
    { label: 'Configure Slack alerts', done: slackConfigured, href: '/settings' },
    { label: 'Connect Datadog / CloudWatch', done: hasIntegrations, href: '/integrations' },
    { label: 'Receive first incident', done: false },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="bg-surface-card border border-brand/20 rounded-xl p-5 mb-8">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-semibold text-sm">Setup Progress</p>
          <p className="text-slate-400 text-xs mt-0.5">Complete these steps to start receiving incidents</p>
        </div>
        <span className="text-brand-light font-bold text-sm">{pct}%</span>
      </div>

      <div className="w-full bg-surface rounded-full h-1.5 mb-4">
        <div
          className="h-1.5 bg-brand rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2.5">
            {step.done ? (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-surface-border flex-shrink-0" />
            )}
            {step.href && !step.done ? (
              <Link to={step.href} className="text-xs text-brand-light hover:underline flex items-center gap-1">
                {step.label} <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <span className={`text-xs ${step.done ? 'text-slate-400 line-through' : 'text-white'}`}>
                {step.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { organization } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: metricsApi.summary,
    refetchInterval: 30_000,
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', 1],
    queryFn: () => incidentsApi.list(1, 10),
    refetchInterval: 15_000,
  });

  const { data: integrations } = useQuery({
    queryKey: ['integrations', organization?.id],
    queryFn: () => integrationsApi.list(organization!.id),
    enabled: !!organization?.id,
  });

  const noiseReduction = metrics?.pipeline.noiseReductionPercent ?? 0;
  const aPI = metrics?.persisted.alertsPerIncident;
  const hasIntegrations = (integrations?.length ?? 0) > 0;
  const hasIncidents = (incidents?.data.length ?? 0) > 0;
  const isNewWorkspace = !metricsLoading && !hasIntegrations && !hasIncidents;
  const slackConfigured = false; // TODO: derive from org settings when exposed in API

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time overview of your incident pipeline</p>
      </div>

      {/* Setup checklist — new workspaces only */}
      {isNewWorkspace && (
        <SetupChecklist hasIntegrations={hasIntegrations} slackConfigured={slackConfigured} />
      )}

      {/* Metric cards */}
      {metricsLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Alerts"
            value={metrics?.persisted.alerts ?? 0}
            sub={metrics?.pipeline.alertsReceived ? `${metrics.pipeline.alertsReceived} received` : 'all time'}
            icon={AlertTriangle}
            accent="bg-orange-500/80"
            trend="neutral"
          />
          <MetricCard
            label="Incidents"
            value={metrics?.persisted.incidents ?? 0}
            sub="grouped incidents"
            icon={Siren}
            accent="bg-red-500/80"
            trend="neutral"
          />
          <MetricCard
            label="Noise Reduction"
            value={`${noiseReduction}%`}
            sub={noiseReduction > 0 ? 'alerts filtered out' : 'no data yet'}
            icon={TrendingDown}
            accent="bg-green-500/80"
            trend={noiseReduction > 50 ? 'down' : 'neutral'}
          />
          <MetricCard
            label="Alerts / Incident"
            value={aPI != null ? aPI.toFixed(1) : '—'}
            sub="grouping efficiency"
            icon={Layers}
            accent="bg-brand/80"
            trend={aPI != null && aPI > 5 ? 'down' : 'neutral'}
          />
        </div>
      )}

      {/* Pipeline activity */}
      {metrics && metrics.pipeline.alertsReceived > 0 && (
        <PipelineBar noiseReduction={noiseReduction} pipeline={metrics.pipeline} />
      )}

      {/* Demo incident for new workspaces */}
      {isNewWorkspace && <DemoIncidentBanner />}

      {/* Recent incidents */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Recent Incidents</h2>
            {hasIncidents && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
            )}
          </div>
          <Link to="/incidents" className="text-brand-light text-xs hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {incidentsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !hasIncidents ? (
          <EmptyIncidents hasIntegrations={hasIntegrations} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Incident</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Status</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Alerts</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Created</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {incidents?.data.map((i) => <IncidentRow key={i.id} incident={i} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions footer */}
      {hasIncidents && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Link
            to="/incidents"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-surface-border hover:border-slate-500 rounded-lg transition-colors"
          >
            <Siren className="w-3.5 h-3.5" /> All incidents
          </Link>
          <Link
            to="/alerts"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-surface-border hover:border-slate-500 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Raw alerts
          </Link>
          {!hasIntegrations && (
            <Link
              to="/integrations"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-light border border-brand/30 hover:border-brand rounded-lg transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Add integration
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
