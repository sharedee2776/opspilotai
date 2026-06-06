export interface SlackReplyContext {
  channel: string;
  ts?: string;
}

export interface ProcessAlertJobPayload {
  rawPayload: Record<string, unknown>;
  slackReply?: SlackReplyContext;
}

export interface GroupIncidentJobPayload {
  service: string;
  minAlerts?: number;
  slackReply?: SlackReplyContext;
}

export interface AnalyzeIncidentJobPayload {
  incidentId: string;
  slackReply?: SlackReplyContext;
}
