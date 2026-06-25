import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { IncidentEntity } from '../../common/entities/incident.entity';
import { RootCauseResult, SummaryResult } from '../ai/ai.service';

export interface PostIncidentCreatedInput {
  channel: string;
  incident: IncidentEntity;
  summary: SummaryResult;
  rootCause: RootCauseResult;
  alertCount: number;
  firstAlertAt?: Date;
}

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name);
  private readonly client: WebClient | null;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('SLACK_BOT_TOKEN');
    if (!token) {
      this.logger.warn('SLACK_BOT_TOKEN not set — Slack notifications disabled');
      this.client = null;
      return;
    }
    this.client = new WebClient(token);
  }

  async postIncidentCreated(input: PostIncidentCreatedInput): Promise<void> {
    if (!this.client) {
      return;
    }
    const { channel, incident, summary, rootCause, alertCount, firstAlertAt } = input;
    const publicUrl = this.config.get<string>('APP_PUBLIC_URL', '');
    const incidentUrl = publicUrl ? `${publicUrl}/incidents/${incident.id}` : null;

    const createdTs = new Date(incident.createdAt).toUTCString().replace(' GMT', ' UTC');
    const firstAlertTs = firstAlertAt
      ? new Date(firstAlertAt).toUTCString().replace(' GMT', ' UTC')
      : null;

    const severityEmoji: Record<string, string> = {
      critical: ':red_circle:',
      high: ':large_orange_circle:',
      medium: ':large_yellow_circle:',
      low: ':white_circle:',
    };
    const emoji = severityEmoji[summary.severity?.toLowerCase()] ?? ':large_orange_circle:';

    try {
      await this.client.chat.postMessage({
        channel,
        text: `${emoji} Incident: ${incident.title}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} Incident: ${incident.title}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Service:*\n\`${summary.service}\`` },
              { type: 'mrkdwn', text: `*Severity:*\n${summary.severity?.toUpperCase()}` },
              { type: 'mrkdwn', text: `*Alert count:*\n${alertCount}` },
              { type: 'mrkdwn', text: `*Status:*\n${incident.status?.toUpperCase()}` },
            ],
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Created:*\n${createdTs}` },
              ...(firstAlertTs ? [{ type: 'mrkdwn' as const, text: `*First Alert:*\n${firstAlertTs}` }] : []),
            ],
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*:mag: AI Summary*\n${summary.summary}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*:bulb: Root Cause*\n${rootCause.root_cause}\n*Confidence:* ${rootCause.confidence}`,
            },
          },
          ...(incidentUrl
            ? [
                { type: 'divider' as const },
                {
                  type: 'actions' as const,
                  elements: [
                    {
                      type: 'button' as const,
                      text: { type: 'plain_text' as const, text: 'View Incident', emoji: true },
                      url: incidentUrl,
                      style: 'primary' as const,
                    },
                  ],
                },
              ]
            : []),
        ],
      });
    } catch (error) {
      this.logger.error('Failed to post incident to Slack', error as Error);
      throw error;
    }
  }
}
