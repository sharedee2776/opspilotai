import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { incidentsApi } from '../api/incidents';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import type { Incident } from '../types';

const STATUS_FILTERS = ['all', 'active', 'investigating', 'resolved'] as const;

export default function IncidentsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', page],
    queryFn: () => incidentsApi.list(page, 20),
    refetchInterval: 15_000,
  });

  const filtered = (data?.data ?? []).filter((i: Incident) => {
    const matchSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.service.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Incidents</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {data?.total ?? 0} total incidents across all services
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or service…"
            className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-lg p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === s
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
          <div className="py-16 text-center text-slate-500 text-sm">No incidents found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Incident</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Alerts</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">AI Analysis</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="border-b border-surface-border hover:bg-surface-hover cursor-pointer transition-colors last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="text-white text-sm font-medium">{incident.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-mono">{incident.service}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={incident.status}>{incident.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{incident.alertCount}</td>
                  <td className="px-4 py-3">
                    {incident.summary ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Analyzed
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
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
          <p className="text-slate-500 text-xs">
            Page {data.page} of {data.totalPages}
          </p>
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
