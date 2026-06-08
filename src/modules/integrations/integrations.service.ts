import { randomBytes } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  IntegrationEntity,
  IntegrationType,
} from '../../common/entities/integration.entity';
import {
  OrganizationMemberEntity,
  OrganizationRole,
} from '../../common/entities/organization-member.entity';
import { CreateIntegrationDto } from './dto/create-integration.dto';

export interface IntegrationCreateResult extends IntegrationEntity {
  webhookUrl?: string;
  webhookHeader?: string;
  webhookSecret?: string;
}

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(IntegrationEntity)
    private readonly integrationRepository: Repository<IntegrationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly organizationMemberRepository: Repository<OrganizationMemberEntity>,
    private readonly config: ConfigService,
  ) {}

  async resolveOrganizationIdForSlackTeam(teamId?: string): Promise<string | null> {
    if (teamId) {
      const integration = await this.integrationRepository.findOne({
        where: { type: IntegrationType.SLACK, externalId: teamId },
      });
      if (integration) {
        return integration.organizationId;
      }
    }

    const fallback = this.config.get<string>('SLACK_DEFAULT_ORGANIZATION_ID');
    return fallback || null;
  }

  async findDatadogIntegration(integrationId: string): Promise<IntegrationEntity | null> {
    return this.integrationRepository.findOne({
      where: { id: integrationId, type: IntegrationType.DATADOG },
    });
  }

  async listForOrganization(organizationId: string, user: AuthenticatedUser) {
    await this.ensureOrganizationAccess(organizationId, user.userId);
    const integrations = await this.integrationRepository.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });

    return integrations.map((integration) => ({
      ...integration,
      credentials: this.redactCredentials(integration.credentials),
    }));
  }

  async create(
    organizationId: string,
    user: AuthenticatedUser,
    dto: CreateIntegrationDto,
  ): Promise<IntegrationCreateResult> {
    await this.ensureOrganizationAdmin(organizationId, user);

    const existing = await this.integrationRepository.findOne({
      where: { type: dto.type, externalId: dto.externalId },
    });
    if (existing) {
      throw new ConflictException('Integration with this external id already exists');
    }

    const credentials = { ...(dto.credentials ?? {}) };
    if (dto.type === IntegrationType.DATADOG && !credentials.webhookSecret) {
      credentials.webhookSecret = randomBytes(32).toString('hex');
    }

    const saved = await this.integrationRepository.save(
      this.integrationRepository.create({
        organizationId,
        type: dto.type,
        externalId: dto.externalId,
        credentials,
      }),
    );

    if (dto.type !== IntegrationType.DATADOG) {
      return saved;
    }

    return {
      ...saved,
      webhookUrl: this.buildDatadogWebhookUrl(saved.id),
      webhookHeader: 'X-OpsPilot-Webhook-Secret',
      webhookSecret: String(credentials.webhookSecret),
    };
  }

  private redactCredentials(credentials: Record<string, unknown>) {
    if (!credentials?.webhookSecret) {
      return credentials;
    }

    return {
      ...credentials,
      webhookSecret: '[redacted]',
    };
  }

  buildDatadogWebhookUrl(integrationId: string): string {
    const baseUrl = this.config.get<string>('APP_PUBLIC_URL', '').replace(/\/$/, '');
    if (!baseUrl) {
      return `/webhooks/datadog/${integrationId}`;
    }
    return `${baseUrl}/webhooks/datadog/${integrationId}`;
  }

  private async ensureOrganizationAccess(organizationId: string, userId: string) {
    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }
    return membership;
  }

  private async ensureOrganizationAdmin(organizationId: string, user: AuthenticatedUser) {
    const membership = await this.ensureOrganizationAccess(organizationId, user.userId);
    if (![OrganizationRole.OWNER, OrganizationRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Admin access required');
    }
    return membership;
  }
}
