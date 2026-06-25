import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { metricsApi } from '../api/metrics';
import { incidentsApi } from '../api/incidents';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { Incident } from '../types';
import {
  AlertTriangle,
  Siren,
  TrendingDown,
  Layers,
} from 'lucide-react';

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function IncidentRow({ incident }: { incident: Incident }) {
  const navigate = useNavigate();
  return (
    <tr
      onClick={() => navigate(`/incidents/${incident.id}`)}
      className="border-b border-surface-border hover:bg-surface-hover cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <p className="text-white text-sm font-medium truncate max-w-xs">{incident.title}</p>
        <p className="text-slate-500 text-xs mt-0.5">{incident.service}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant={incident.status}>{incident.status}</Badge>
      </td>
      <td className="px-4 py-3 text-slate-400 text-sm">{incident.alertCount}</td>
      <td className="px-4 py-3 text-slate-400 text-xs">
        {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
      </td>
    </tr>
  );
}

export default function Dashboard() {
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

  const noiseReduction = metrics?.pipeline.noiseReductionPercent ?? 0;
  const aPI = metrics?.persisted.alertsPerIncident;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Real-time overview of your incident pipeline</p>
      </div>

      {/* Metric cards */}
      {metricsLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Alerts"
            value={metrics?.persisted.alerts ?? 0}
            sub="all time"
            icon={AlertTriangle}
            accent="bg-orange-500/80"
          />
          <MetricCard
            label="Incidents"
            value={metrics?.persisted.incidents ?? 0}
            sub="all time"
            icon={Siren}
            accent="bg-red-500/80"
          />
          <MetricCard
            label="Noise Reduction"
            value={`${noiseReduction}%`}
            sub="alerts filtered out"
            icon={TrendingDown}
            accent="bg-green-500/80"
          />
          <MetricCard
            label="Alerts / Incident"
            value={aPI != null ? aPI.toFixed(1) : '—'}
            sub="grouping ratio"
            icon={Layers}
            accent="bg-brand/80"
          />
        </div>
      )}

      {/* Top services */}
      {metrics && (
        <div className="mb-8 bg-surface-card border border-surface-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Pipeline Activity</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Received', v: metrics.pipeline.alertsReceived },
              { label: 'Deduped', v: metrics.pipeline.duplicatesSkipped },
              { label: 'Stored', v: metrics.pipeline.alertsStored },
              { label: 'Incidents', v: metrics.pipeline.incidentsCreated },
            ].map(({ label, v }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{v}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-surface rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ width: `${noiseReduction}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1">{noiseReduction}% noise reduction</p>
        </div>
      )}

      {/* Recent incidents */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Incidents</h2>
          <a href="/incidents" className="text-brand-light text-xs hover:underline">View all →</a>
        </div>
        {incidentsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : incidents?.data.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No incidents yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Incident</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Status</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Alerts</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents?.data.map((i) => <IncidentRow key={i.id} incident={i} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
