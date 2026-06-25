import api from './client';
import type { Alert, PaginatedResult } from '../types';

export const alertsApi = {
  list: (page = 1, limit = 20) =>
    api.get<PaginatedResult<Alert>>('/alerts', { params: { page, limit } }).then((r) => r.data),

  get: (id: string) =>
    api.get<Alert>(`/alerts/${id}`).then((r) => r.data),
};
