import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { AlertsService } from '../../../modules/alerts/alerts.service';
import { IncidentBuilderService } from '../../../modules/incidents/services/incident-builder.service';
import { IncidentsService } from '../../../modules/incidents/incidents.service';
import { AiService } from '../../../modules/ai/ai.service';
import { SlackNotificationService } from '../../../modules/slack/slack-notification.service';
import { ActionsService } from '../../../modules/actions/actions.service';
import { OrganizationsService } from '../../../modules/organizations/organizations.service';
import {
  JOB_ANALYZE_INCIDENT,
  JOB_GROUP_INCIDENT,
  JOB_PROCESS_ALERT,
  QUEUE_AI_ANALYSIS,
  QUEUE_ALERTS,
  QUEUE_INCIDENTS,
} from '../queue.constants';
import {
  AnalyzeIncidentJobPayload,
  GroupIncidentJobPayload,
  ProcessAlertJobPayload,
} from '../queue.types';
import { QueueProducerService } from '../queue-producer.service';
import { MetricsService } from '../../../modules/metrics/metrics.service';

@Injectable()
export class AlertProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertProcessor.name);
  private worker: Worker | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly alertsService: AlertsService,
    private readonly queueProducer: QueueProducerService,
    private readonly metricsService: MetricsService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      QUEUE_ALERTS,
      async (job) => {
        if (job.name !== JOB_PROCESS_ALERT) {
          return;
        }

        const payload = job.data as ProcessAlertJobPayload;
        await this.metricsService.recordAlertReceived(payload.organizationId);

        const result = await this.alertsService.ingestAlert({
          organizationId: payload.organizationId,
          integrationId: payload.integrationId,
          rawPayload: payload.rawPayload,
        });

        if (result.duplicate) {
          await this.metricsService.recordDuplicateSkipped(payload.organizationId);
          this.logger.log(
            `Skipped duplicate alert for org ${payload.organizationId} service ${result.service}`,
          );
          return { duplicate: true, service: result.service, organizationId: payload.organizationId };
        }

        await this.metricsService.recordAlertStored(payload.organizationId);

        await this.queueProducer.enqueueGroupIncident({
          organizationId: payload.organizationId,
          service: result.service,
          slackReply: payload.slackReply,
        });

        return {
          duplicate: false,
          alertId: result.alert?.id,
          service: result.service,
          organizationId: payload.organizationId,
        };
      },
      { connection: this.redisService.getBullMqConnection() },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Alert job ${job?.id} failed: ${error.message}`);
    });
    this.worker.on('error', (error) => {
      this.logger.error(`AlertProcessor worker error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

@Injectable()
export class IncidentProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IncidentProcessor.name);
  private worker: Worker | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
    private readonly incidentBuilder: IncidentBuilderService,
    private readonly queueProducer: QueueProducerService,
    private readonly metricsService: MetricsService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      QUEUE_INCIDENTS,
      async (job) => {
        if (job.name !== JOB_GROUP_INCIDENT) {
          return;
        }

        const payload = job.data as GroupIncidentJobPayload;
        const minAlerts = payload.minAlerts ?? Number(this.config.get<string>('MIN_ALERTS_TO_GROUP', '2'));
        const incident = await this.incidentBuilder.createIncidentIfThresholdMet(
          payload.organizationId,
          payload.service,
          minAlerts,
        );

        if (!incident) {
          this.logger.log(
            `Incident threshold not met for org ${payload.organizationId} service ${payload.service}`,
          );
          return { incidentCreated: false, service: payload.service, organizationId: payload.organizationId };
        }

        await this.metricsService.recordIncidentCreated(payload.organizationId);

        await this.queueProducer.enqueueAnalyzeIncident({
          organizationId: payload.organizationId,
          incidentId: incident.id,
          slackReply: payload.slackReply,
        });

        return {
          incidentCreated: true,
          incidentId: incident.id,
          service: payload.service,
          organizationId: payload.organizationId,
        };
      },
      { connection: this.redisService.getBullMqConnection() },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Incident job ${job?.id} failed: ${error.message}`);
    });
    this.worker.on('error', (error) => {
      this.logger.error(`IncidentProcessor worker error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

@Injectable()
export class AiAnalysisProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiAnalysisProcessor.name);
  private worker: Worker | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly incidentsService: IncidentsService,
    private readonly aiService: AiService,
    private readonly slackNotification: SlackNotificationService,
    private readonly actionsService: ActionsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      QUEUE_AI_ANALYSIS,
      async (job) => {
        if (job.name !== JOB_ANALYZE_INCIDENT) {
          return;
        }

        const payload = job.data as AnalyzeIncidentJobPayload;
        const incident = await this.incidentsService.findById(payload.incidentId, payload.organizationId);

        if (!incident) {
          throw new Error(`Incident ${payload.incidentId} not found for org ${payload.organizationId}`);
        }

        const alerts = incident.alerts?.length
          ? incident.alerts
          : await this.incidentsService.getAlertsForIncident(incident.id, payload.organizationId);

        if (!alerts.length) {
          throw new Error(`No alerts found for incident ${payload.incidentId}`);
        }

        const summary = await this.aiService.summarizeAlerts(alerts);
        // If GPT returns 'unknown' for service, use the known incident service
        if (!summary.service || summary.service === 'unknown') {
          summary.service = incident.service ?? 'unknown';
        }

        const rootCause = await this.aiService.analyzeRootCause(alerts);
        const suggestedFixes = await this.aiService.suggestFixes(alerts, rootCause.root_cause);

        await this.incidentsService.updateWithAiResults(
          incident.id,
          payload.organizationId,
          summary.summary,
          rootCause.root_cause,
        );

        if (suggestedFixes.length) {
          await this.actionsService.createFromSuggestions(
            incident.id,
            payload.organizationId,
            suggestedFixes,
          );
          this.logger.log(`Created ${suggestedFixes.length} suggested action(s) for incident ${incident.id}`);
        }

        const slackChannel =
          payload.slackReply?.channel ??
          await this.resolveDefaultSlackChannel(payload.organizationId);

        if (slackChannel) {
          const firstAlertAt = alerts.length > 0 ? new Date(alerts[0].createdAt) : undefined;
          await this.slackNotification.postIncidentCreated({
            channel: slackChannel,
            incident,
            summary,
            rootCause,
            alertCount: alerts.length,
            firstAlertAt,
          });
        } else {
          this.logger.warn(
            `No Slack channel for incident ${incident.id} — set defaultSlackChannelId via PATCH /organizations/:id/settings`,
          );
        }

        return { incidentId: incident.id, organizationId: payload.organizationId, analyzed: true };
      },
      { connection: this.redisService.getBullMqConnection() },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`AI analysis job ${job?.id} failed: ${error.message}`);
    });
    this.worker.on('error', (error) => {
      this.logger.error(`AiAnalysisProcessor worker error: ${error.message}`);
    });
  }

  private async resolveDefaultSlackChannel(organizationId: string): Promise<string | null> {
    const settings = await this.organizationsService.getSettings(organizationId);
    return (settings.defaultSlackChannelId as string) ?? null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
