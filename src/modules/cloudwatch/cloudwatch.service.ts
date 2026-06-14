import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IntegrationEntity } from '../../common/entities/integration.entity';
import { QueueProducerService } from '../../core/queue/queue-producer.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { CloudWatchNormalizerService } from './cloudwatch-normalizer.service';

@Injectable()
export class CloudWatchService {
  private readonly logger = new Logger(CloudWatchService.name);

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly cloudwatchNormalizer: CloudWatchNormalizerService,
    private readonly queueProducer: QueueProducerService,
  ) {}

  async ingestWebhook(
    integrationId: string,
    webhookSecret: string | undefined,
    payload: Record<string, unknown>,
  ) {
    const integration = await this.integrationsService.findCloudWatchIntegration(integrationId);
    if (!integration) {
      throw new NotFoundException('CloudWatch integration not found');
    }

    this.validateWebhookSecret(integration, webhookSecret);

    const normalized = this.cloudwatchNormalizer.normalize(payload);
    const job = await this.queueProducer.enqueueAlert({
      organizationId: integration.organizationId,
      integrationId: integration.id,
      rawPayload: { ...normalized } as Record<string, unknown>,
    });

    this.logger.log(
      `Queued CloudWatch alert for org ${integration.organizationId} service ${normalized.service}`,
    );

    return {
      status: 'queued',
      jobId: job.id,
      queue: job.queueName,
      organizationId: integration.organizationId,
      service: normalized.service,
    };
  }

  private validateWebhookSecret(integration: IntegrationEntity, providedSecret?: string) {
    const expectedSecret = String(integration.credentials?.webhookSecret || '');
    if (!expectedSecret) {
      throw new UnauthorizedException('CloudWatch integration is missing webhookSecret configuration');
    }
    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid CloudWatch webhook secret');
    }
  }
}
