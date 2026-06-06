import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import { AlertsService } from '../alerts/alerts.service';
import { IncidentBuilderService } from '../incidents/services/incident-builder.service';
import { IncidentsService } from '../incidents/incidents.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SlackService {
  public receiver: ExpressReceiver;
  public slackApp: App;
  private readonly logger = new Logger(SlackService.name);
  private readonly minAlertsToGroup: number;

  constructor(
    private readonly config: ConfigService,
    private readonly alertsService: AlertsService,
    private readonly incidentBuilder: IncidentBuilderService,
    private readonly incidentsService: IncidentsService,
    private readonly aiService: AiService,
  ) {
    const botToken = this.config.get<string>('SLACK_BOT_TOKEN');
    const signingSecret = this.config.get<string>('SLACK_SIGNING_SECRET') || '';
    this.minAlertsToGroup = Number(this.config.get<string>('MIN_ALERTS_TO_GROUP', '2'));

    if (!botToken || !signingSecret) {
      throw new Error('Slack bot token and signing secret must be configured.');
    }

    this.receiver = new ExpressReceiver({
      signingSecret,
      endpoints: '/events',
      processBeforeResponse: true,
    });

    this.slackApp = new App({
      token: botToken,
      receiver: this.receiver,
      logLevel: LogLevel.INFO,
    });

    this.registerListeners();
  }

  private registerListeners() {
    this.slackApp.message(async ({ message, client }) => {
      if (typeof message !== 'object' || !('text' in message)) {
        return;
      }

      if ((message as any).subtype || (message as any).bot_id) {
        return;
      }

      const text = String((message as any).text || '').trim();
      if (!text) {
        return;
      }

      const service = this.extractService(text);
      if (service === 'unknown') {
        return;
      }

      const severity = this.extractSeverity(text);
      const channel = String((message as any).channel || '');
      const ts = String((message as any).ts || '');

      try {
        await this.alertsService.create({
          title: text,
          description: text,
          service,
          severity,
          source: 'slack',
          metadata: { channel, ts },
        });

        const pendingAlerts = await this.incidentBuilder.findPendingAlertsForService(service);
        const incident = await this.incidentBuilder.createIncidentIfThresholdMet(service, this.minAlertsToGroup);
        if (!incident) {
          return;
        }

        const summary = await this.aiService.summarizeAlerts(pendingAlerts);
        const rootCause = await this.aiService.analyzeRootCause(pendingAlerts);
        await this.incidentsService.updateWithAiResults(incident.id, summary.summary, rootCause.root_cause, rootCause.confidence);

        await client.chat.postMessage({
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
                  text: `*Service:*
${summary.service}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Severity:*
${summary.severity}`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Summary:*
${summary.summary}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Root cause:*
${rootCause.root_cause}\n*Confidence:* ${rootCause.confidence}`,
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Alert count:* ${pendingAlerts.length}`,
              },
            },
          ],
        });
      } catch (error) {
        this.logger.error('Slack event handling failed', error as Error);
      }
    });
  }

  private extractService(text: string): string {
    const match = text.match(/^\[([^\]]+)\]/);
    return match ? match[1].trim().toLowerCase() : 'unknown';
  }

  private extractSeverity(text: string): string {
    const normalized = text.toLowerCase();
    if (normalized.includes('critical') || normalized.includes('sev0') || normalized.includes('sev1')) {
      return 'critical';
    }
    if (normalized.includes('high') || normalized.includes('sev2') || normalized.includes('error') || normalized.includes('failure')) {
      return 'high';
    }
    if (normalized.includes('medium') || normalized.includes('warning') || normalized.includes('warn')) {
      return 'medium';
    }
    return 'low';
  }
}
