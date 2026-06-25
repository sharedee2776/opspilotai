import api from './client';
import type { Integration } from '../types';

export const integrationsApi = {
  list: (orgId: string) =>
    api.get<Integration[]>(`/organizations/${orgId}/integrations`).then((r) => r.data),

  create: (
    orgId: string,
    data: { type: 'datadog' | 'cloudwatch'; externalId: string },
  ) =>
    api
      .post<Integration & { webhookUrl: string; webhookSecret: string }>(
        `/organizations/${orgId}/integrations`,
        data,
      )
      .then((r) => r.data),
};
