import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Clock,
  Terminal,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { incidentsApi } from '../api/incidents';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { Action, Incident } from '../types';

function fmt(d: string) {
  return format(new Date(d), 'MMM d, HH:mm:ss') + ' UTC';
}

function TimelineStep({
  icon: Icon,
  label,
  time,
  color,
  last,
}: {
  icon: React.ElementType;
  label: string;
  time?: string;
  color: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {!last && <div className="w-px flex-1 bg-surface-border mt-1" />}
      </div>
      <div className="pb-5 pt-1">
        <p className="text-white text-sm font-medium">{label}</p>
        {time && <p className="text-slate-500 text-xs mt-0.5">{time}</p>}
      </div>
    </div>
  );
}

function ActionCard({ action, incidentId }: { action: Action; incidentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const mutOpts = {
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incident', incidentId] }),
  };

  const approve = useMutation({ mutationFn: () => incidentsApi.approveAction(action.id), ...mutOpts });
  const reject = useMutation({ mutationFn: () => incidentsApi.rejectAction(action.id), ...mutOpts });
  const execute = useMutation({ mutationFn: () => incidentsApi.executeAction(action.id), ...mutOpts });

  const riskColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  };

  return (
    <div className="bg-surface border border-surface-border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <Terminal className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{action.name}</p>
          <p className={`text-xs mt-0.5 ${riskColors[action.riskLevel] ?? 'text-slate-400'}`}>
            {action.riskLevel} risk · {action.type}
          </p>
        </div>
        <Badge variant={action.status}>{action.status}</Badge>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-border">
          <pre className="mt-3 bg-black/40 rounded-lg p-3 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
            {action.command}
          </pre>

          {action.status === 'suggested' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => approve.mutate()}
                disabled={approve.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => reject.mutate()}
                disabled={reject.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}

          {action.status === 'approved' && (
            <button
              onClick={() => execute.mutate()}
              disabled={execute.isPending}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-brand/20 hover:bg-brand/30 border border-brand/30 text-brand-light rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {execute.isPending ? 'Executing…' : 'Execute'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsApi.get(id!),
    refetchInterval: 10_000,
  });

  const updateStatus = useMutation({
    mutationFn: (status: Incident['status']) => incidentsApi.updateStatus(id!, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incident', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6 text-center text-slate-400">Incident not found.</div>
    );
  }

  const alerts = incident.alerts ?? [];
  const actions = incident.actions ?? [];
  const firstAlert = alerts[0];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <button
        onClick={() => navigate('/incidents')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All incidents
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">{incident.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <code className="text-brand-light text-xs bg-brand/10 px-2 py-0.5 rounded">
              {incident.service}
            </code>
            <Badge variant={incident.status}>{incident.status}</Badge>
            <span className="text-slate-500 text-xs">
              {incident.alertCount} alerts · {fmt(incident.createdAt)}
            </span>
          </div>
        </div>

        {/* Status controls */}
        <div className="flex gap-2">
          {incident.status === 'active' && (
            <button
              onClick={() => updateStatus.mutate('investigating')}
              className="px-3 py-1.5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-medium transition-colors"
            >
              Start investigating
            </button>
          )}
          {incident.status !== 'resolved' && (
            <button
              onClick={() => updateStatus.mutate('resolved')}
              className="px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-colors"
            >
              Mark resolved
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: AI analysis */}
        <div className="lg:col-span-2 space-y-4">

          {/* AI Summary */}
          {incident.summary && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-brand-light" />
                <h2 className="text-sm font-semibold text-white">AI Summary</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{incident.summary}</p>
            </div>
          )}

          {/* Root Cause */}
          {incident.rootCause && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-semibold text-white">Root Cause</h2>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{incident.rootCause}</p>
            </div>
          )}

          {/* Suggested Actions */}
          {actions.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-semibold text-white">Suggested Remediations</h2>
                <span className="text-xs text-slate-500">({actions.length})</span>
              </div>
              <div className="space-y-2">
                {actions.map((action) => (
                  <ActionCard key={action.id} action={action} incidentId={incident.id} />
                ))}
              </div>
            </div>
          )}

          {/* Alert list */}
          {alerts.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border">
                <h2 className="text-sm font-semibold text-white">Alerts ({alerts.length})</h2>
              </div>
              <div className="divide-y divide-surface-border">
                {alerts.map((alert) => (
                  <div key={alert.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white text-sm">{alert.title}</p>
                        {alert.description && (
                          <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                            {alert.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Badge variant={alert.severity}>{alert.severity}</Badge>
                        <Badge variant={alert.source}>{alert.source}</Badge>
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">{fmt(alert.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Timeline */}
        <div className="space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Timeline</h2>
            <div>
              {firstAlert && (
                <TimelineStep
                  icon={AlertTriangle}
                  label={`First alert: ${firstAlert.service}`}
                  time={fmt(firstAlert.createdAt)}
                  color="bg-orange-500"
                />
              )}
              <TimelineStep
                icon={Clock}
                label="Incident grouped"
                time={fmt(incident.createdAt)}
                color="bg-red-500"
              />
              {incident.summary && (
                <TimelineStep
                  icon={Brain}
                  label="AI analysis complete"
                  time={fmt(incident.updatedAt)}
                  color="bg-brand"
                />
              )}
              {incident.status === 'investigating' && (
                <TimelineStep
                  icon={AlertCircle}
                  label="Under investigation"
                  color="bg-yellow-500"
                />
              )}
              {incident.status === 'resolved' && (
                <TimelineStep
                  icon={CheckCircle}
                  label="Resolved"
                  time={fmt(incident.updatedAt)}
                  color="bg-green-500"
                  last
                />
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Details</h2>
            {[
              { label: 'Service', value: incident.service },
              { label: 'Status', value: incident.status },
              { label: 'Alert count', value: String(incident.alertCount) },
              { label: 'Created', value: fmt(incident.createdAt) },
              ...(incident.slackChannelId
                ? [{ label: 'Slack channel', value: incident.slackChannelId }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-slate-500 text-xs">{label}</span>
                <span className="text-white text-xs font-medium text-right truncate">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
