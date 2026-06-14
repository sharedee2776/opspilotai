import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  OrganizationMemberEntity,
  OrganizationRole,
} from '../../common/entities/organization-member.entity';
import { OrganizationEntity } from '../../common/entities/organization.entity';
import { TeamMemberEntity, TeamRole } from '../../common/entities/team-member.entity';
import { TeamEntity } from '../../common/entities/team.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly organizationMemberRepository: Repository<OrganizationMemberEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepository: Repository<TeamMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async listForUser(userId: string) {
    const memberships = await this.organizationMemberRepository.find({
      where: { userId },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });

    return memberships.map((membership) => ({
      ...membership.organization,
      role: membership.role,
    }));
  }

  async createOrganization(user: AuthenticatedUser, dto: CreateOrganizationDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    const organization = await this.organizationRepository.save(
      this.organizationRepository.create({ name: dto.name, slug }),
    );

    await this.organizationMemberRepository.save(
      this.organizationMemberRepository.create({
        organizationId: organization.id,
        userId: user.userId,
        role: OrganizationRole.OWNER,
      }),
    );

    return organization;
  }

  async updateSettings(
    organizationId: string,
    user: AuthenticatedUser,
    dto: UpdateSettingsDto,
  ): Promise<OrganizationEntity> {
    await this.ensureOrganizationAdmin(organizationId, user);
    const org = await this.organizationRepository.findOneOrFail({ where: { id: organizationId } });
    org.settings = { ...org.settings, ...dto };
    return this.organizationRepository.save(org);
  }

  async getSettings(organizationId: string): Promise<Record<string, unknown>> {
    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    return org?.settings ?? {};
  }

  async listTeams(organizationId: string, user: AuthenticatedUser) {
    await this.ensureOrganizationAccess(organizationId, user.userId);

    return this.teamRepository.find({
      where: { organizationId },
      relations: ['members', 'members.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async createTeam(organizationId: string, user: AuthenticatedUser, dto: CreateTeamDto) {
    await this.ensureOrganizationAdmin(organizationId, user);

    const team = await this.teamRepository.save(
      this.teamRepository.create({
        organizationId,
        name: dto.name,
      }),
    );

    await this.teamMemberRepository.save(
      this.teamMemberRepository.create({
        teamId: team.id,
        userId: user.userId,
        role: TeamRole.LEAD,
      }),
    );

    return this.teamRepository.findOne({
      where: { id: team.id },
      relations: ['members', 'members.user'],
    });
  }

  async addTeamMember(
    organizationId: string,
    teamId: string,
    user: AuthenticatedUser,
    dto: AddTeamMemberDto,
  ) {
    await this.ensureOrganizationAdmin(organizationId, user);

    const team = await this.teamRepository.findOne({ where: { id: teamId, organizationId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const targetUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const orgMember = await this.organizationMemberRepository.findOne({
      where: { organizationId, userId: targetUser.id },
    });
    if (!orgMember) {
      throw new ForbiddenException('User must belong to the organization before joining a team');
    }

    const existing = await this.teamMemberRepository.findOne({
      where: { teamId, userId: targetUser.id },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this team');
    }

    return this.teamMemberRepository.save(
      this.teamMemberRepository.create({
        teamId,
        userId: targetUser.id,
        role: dto.role ?? TeamRole.MEMBER,
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

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'organization';

    let slug = base;
    let suffix = 1;

    while (await this.organizationRepository.exists({ where: { slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}
