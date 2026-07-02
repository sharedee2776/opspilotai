import api from './client';
import type { AdminOverview, AdminOrg, AdminUser } from '../types';

export const adminApi = {
  overview: () => api.get<AdminOverview>('/admin/overview').then((r) => r.data),
  organizations: () => api.get<AdminOrg[]>('/admin/organizations').then((r) => r.data),
  users: () => api.get<AdminUser[]>('/admin/users').then((r) => r.data),
  organizationDetail: (id: string) =>
    api.get(`/admin/organizations/${id}`).then((r) => r.data),
};
