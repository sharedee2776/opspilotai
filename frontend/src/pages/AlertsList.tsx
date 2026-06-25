import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { alertsApi } from '../api/alerts';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { Alert } from '../types';

const SEVERITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low'] as const;

export default function AlertsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<(typeof SEVERITY_FILTERS)[number]>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', page],
    queryFn: () => alertsApi.list(page, 20),
    refetchInterval: 15_000,
  });

  const filtered = (data?.data ?? []).filter((a: Alert) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.service.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severity === 'all' || a.severity === severity;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Alerts</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {data?.total ?? 0} total alerts ingested
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts…"
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-lg p-1">
          {SEVERITY_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                severity === s
                  ? 'bg-brand text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No alerts found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Alert</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Severity</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Source</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Incident</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-surface-border hover:bg-surface-hover transition-colors last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{alert.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-mono">{alert.service}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={alert.status}>{alert.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={alert.source}>{alert.source}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {alert.incidentId ? (
                      <button
                        onClick={() => navigate(`/incidents/${alert.incidentId}`)}
                        className="text-brand-light text-xs hover:underline"
                      >
                        View →
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-500 text-xs">Page {data.page} of {data.totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-card border border-surface-border rounded-lg text-sm text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-card border border-surface-border rounded-lg text-sm text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
