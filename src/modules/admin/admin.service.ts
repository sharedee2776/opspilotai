import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../common/entities/user.entity';
import { OrganizationEntity } from '../../common/entities/organization.entity';
import { OrganizationMemberEntity } from '../../common/entities/organization-member.entity';
import { IncidentEntity, IncidentStatus } from '../../common/entities/incident.entity';
import { AlertEntity } from '../../common/entities/alert.entity';
import { IntegrationEntity } from '../../common/entities/integration.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly orgs: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly members: Repository<OrganizationMemberEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidents: Repository<IncidentEntity>,
    @InjectRepository(AlertEntity)
    private readonly alerts: Repository<AlertEntity>,
    @InjectRepository(IntegrationEntity)
    private readonly integrations: Repository<IntegrationEntity>,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      totalOrgs,
      totalIncidents,
      totalAlerts,
      totalIntegrations,
      activeIncidents,
    ] = await Promise.all([
      this.users.count(),
      this.orgs.count(),
      this.incidents.count(),
      this.alerts.count(),
      this.integrations.count(),
      this.incidents.count({ where: { status: IncidentStatus.ACTIVE } }),
    ]);

    // Signups per day for the last 14 days
    const signupTrend = await this.users
      .createQueryBuilder('u')
      .select(`DATE_TRUNC('day', u."createdAt")`, 'day')
      .addSelect('COUNT(*)', 'count')
      .where(`u."createdAt" > NOW() - INTERVAL '14 days'`)
      .groupBy(`DATE_TRUNC('day', u."createdAt")`)
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; count: string }>();

    return {
      totals: {
        users: totalUsers,
        organizations: totalOrgs,
        incidents: totalIncidents,
        alerts: totalAlerts,
        integrations: totalIntegrations,
        activeIncidents,
      },
      signupTrend: signupTrend.map((r) => ({
        day: r.day,
        count: parseInt(r.count, 10),
      })),
    };
  }

  async listOrganizations() {
    const orgs = await this.orgs.find({ order: { createdAt: 'DESC' } });

    const stats = await Promise.all(
      orgs.map(async (org) => {
        const [memberCount, incidentCount, alertCount, integrationCount] = await Promise.all([
          this.members.count({ where: { organizationId: org.id } }),
          this.incidents.count({ where: { organizationId: org.id } }),
          this.alerts.count({ where: { organizationId: org.id } }),
          this.integrations.count({ where: { organizationId: org.id } }),
        ]);
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          createdAt: org.createdAt,
          memberCount,
          incidentCount,
          alertCount,
          integrationCount,
        };
      }),
    );

    return stats;
  }

  async listUsers() {
    const users = await this.users.find({ order: { createdAt: 'DESC' } });

    const withOrgs = await Promise.all(
      users.map(async (user) => {
        const memberships = await this.members.find({
          where: { userId: user.id },
          relations: ['organization'],
          order: { createdAt: 'ASC' },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          organizations: memberships.map((m) => ({
            id: m.organizationId,
            name: m.organization?.name,
            slug: m.organization?.slug,
            role: m.role,
          })),
        };
      }),
    );

    return withOrgs;
  }

  async getOrganizationDetail(orgId: string) {
    const org = await this.orgs.findOne({ where: { id: orgId } });
    if (!org) return null;

    const [members, incidents, integrations] = await Promise.all([
      this.members.find({ where: { organizationId: orgId }, relations: ['user'] }),
      this.incidents.find({
        where: { organizationId: orgId },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.integrations.find({ where: { organizationId: orgId } }),
    ]);

    return {
      org,
      members: members.map((m) => ({
        id: m.userId,
        name: m.user?.name,
        email: m.user?.email,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      recentIncidents: incidents,
      integrations,
    };
  }
}
