export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  emailVerified?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Alert {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'grouped' | 'resolved';
  source: 'slack' | 'datadog' | 'cloudwatch';
  incidentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  id: string;
  name: string;
  type: string;
  command: string;
  status: 'suggested' | 'approved' | 'executing' | 'success' | 'failed';
  riskLevel: 'low' | 'medium' | 'high';
  incidentId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  organizationId: string;
  title: string;
  service: string;
  status: 'active' | 'investigating' | 'resolved';
  alertCount: number;
  summary: string | null;
  rootCause: string | null;
  slackChannelId: string | null;
  slackMessageTs: string | null;
  alerts?: Alert[];
  actions?: Action[];
  createdAt: string;
  updatedAt: string;
}

export interface MetricsSummary {
  organizationId: string;
  pipeline: {
    alertsReceived: number;
    duplicatesSkipped: number;
    alertsStored: number;
    incidentsCreated: number;
    duplicateRatePercent: number;
    noiseReductionPercent: number;
    alertsPerIncident: number | null;
  };
  persisted: {
    alerts: number;
    incidents: number;
    alertsPerIncident: number | null;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  organization: Organization;
  isSuperAdmin?: boolean;
  availableOrganizations?: Array<{ organization: Organization; role: string }>;
}

export interface AdminOverview {
  totals: {
    users: number;
    organizations: number;
    incidents: number;
    alerts: number;
    integrations: number;
    activeIncidents: number;
  };
  signupTrend: Array<{ day: string; count: number }>;
}

export interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
  incidentCount: number;
  alertCount: number;
  integrationCount: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  organizations: Array<{ id: string; name: string; slug: string; role: string }>;
}

export interface OrgMember {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  user: { id: string; email: string; name: string };
  createdAt: string;
}

export interface Integration {
  id: string;
  organizationId: string;
  type: 'slack' | 'datadog' | 'cloudwatch';
  externalId: string;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: string;
}
