import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import { QueueProducerService } from '../../core/queue/queue-producer.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class SlackService {
  public receiver: ExpressReceiver;
  public slackApp: App;
  private readonly logger = new Logger(SlackService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly queueProducer: QueueProducerService,
    private readonly integrationsService: IntegrationsService,
  ) {
    const botToken = this.config.get<string>('SLACK_BOT_TOKEN');
    const signingSecret = this.config.get<string>('SLACK_SIGNING_SECRET') || '';

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
    this.slackApp.message(async ({ message, context }) => {
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

      const teamId = context.teamId || String((message as any).team || '');
      const organizationId = await this.integrationsService.resolveOrganizationIdForSlackTeam(teamId);

      if (!organizationId) {
        this.logger.warn(
          `Skipping Slack alert: no organization mapped for team ${teamId || 'unknown'}. ` +
            'Create a Slack integration or set SLACK_DEFAULT_ORGANIZATION_ID.',
        );
        return;
      }

      const severity = this.extractSeverity(text);
      const channel = String((message as any).channel || '');
      const ts = String((message as any).ts || '');

      try {
        await this.queueProducer.enqueueAlert({
          organizationId,
          rawPayload: {
            title: text,
            description: text,
            service,
            severity,
            source: 'slack',
            metadata: { channel, ts, teamId },
          },
          slackReply: { channel, ts },
        });
      } catch (error) {
        this.logger.error('Failed to enqueue Slack alert', error as Error);
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
