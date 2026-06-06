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
}

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name);
  private readonly client: WebClient;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('SLACK_BOT_TOKEN');
    if (!token) {
      throw new Error('SLACK_BOT_TOKEN is required for Slack notifications');
    }
    this.client = new WebClient(token);
  }

  async postIncidentCreated(input: PostIncidentCreatedInput): Promise<void> {
    const { channel, incident, summary, rootCause, alertCount } = input;

    try {
      await this.client.chat.postMessage({
        channel,
        text: `Incident created: ${incident.title}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Incident created:* ${incident.title}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Service:*\n${summary.service}`,
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${summary.severity}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Summary:*\n${summary.summary}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Root cause:*\n${rootCause.root_cause}\n*Confidence:* ${rootCause.confidence}`,
            },
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Alert count:* ${alertCount}`,
            },
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to post incident to Slack', error as Error);
      throw error;
    }
  }
}
