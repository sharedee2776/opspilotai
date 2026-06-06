export interface SlackReplyContext {
  channel: string;
  ts?: string;
}

export interface ProcessAlertJobPayload {
  organizationId: string;
  integrationId?: string;
  rawPayload: Record<string, unknown>;
  slackReply?: SlackReplyContext;
}

export interface GroupIncidentJobPayload {
  organizationId: string;
  service: string;
  minAlerts?: number;
  slackReply?: SlackReplyContext;
}

export interface AnalyzeIncidentJobPayload {
  organizationId: string;
  incidentId: string;
  slackReply?: SlackReplyContext;
}
