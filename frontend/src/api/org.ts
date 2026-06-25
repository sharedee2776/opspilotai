import api from './client';
import type { OrgMember } from '../types';

export const orgApi = {
  listMembers: (orgId: string) =>
    api.get<OrgMember[]>(`/organizations/${orgId}/members`).then((r) => r.data),

  addMember: (orgId: string, email: string, role: 'admin' | 'member' = 'member') =>
    api.post<OrgMember>(`/organizations/${orgId}/members`, { email, role }).then((r) => r.data),

  removeMember: (orgId: string, userId: string) =>
    api.delete(`/organizations/${orgId}/members/${userId}`).then((r) => r.data),

  updateSettings: (orgId: string, settings: { defaultSlackChannelId?: string; defaultSlackChannelName?: string }) =>
    api.patch(`/organizations/${orgId}/settings`, settings).then((r) => r.data),
};
