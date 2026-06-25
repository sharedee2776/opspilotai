import api from './client';
import type { Incident, Action, PaginatedResult } from '../types';

export const incidentsApi = {
  list: (page = 1, limit = 20) =>
    api.get<PaginatedResult<Incident>>('/incidents', { params: { page, limit } }).then((r) => r.data),

  get: (id: string) =>
    api.get<Incident>(`/incidents/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: Incident['status']) =>
    api.patch<Incident>(`/incidents/${id}/status`, { status }).then((r) => r.data),

  getActions: (incidentId: string) =>
    api.get<Action[]>(`/incidents/${incidentId}/actions`).then((r) => r.data),

  approveAction: (actionId: string) =>
    api.patch<Action>(`/actions/${actionId}/approve`).then((r) => r.data),

  rejectAction: (actionId: string) =>
    api.patch<Action>(`/actions/${actionId}/reject`).then((r) => r.data),

  executeAction: (actionId: string) =>
    api.post<Action>(`/actions/${actionId}/execute`).then((r) => r.data),
};
