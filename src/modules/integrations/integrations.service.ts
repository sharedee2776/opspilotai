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

  async listForOrganization(organizationId: string, user: AuthenticatedUser) {
    await this.ensureOrganizationAccess(organizationId, user.userId);
    return this.integrationRepository.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(organizationId: string, user: AuthenticatedUser, dto: CreateIntegrationDto) {
    await this.ensureOrganizationAdmin(organizationId, user);

    const existing = await this.integrationRepository.findOne({
      where: { type: dto.type, externalId: dto.externalId },
    });
    if (existing) {
      throw new ConflictException('Integration with this external id already exists');
    }

    return this.integrationRepository.save(
      this.integrationRepository.create({
        organizationId,
        type: dto.type,
        externalId: dto.externalId,
        credentials: dto.credentials ?? {},
      }),
    );
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
