import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OrganizationMemberEntity, OrganizationRole } from '../../common/entities/organization-member.entity';
import { OrganizationEntity } from '../../common/entities/organization.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { FirebaseRegisterDto } from './dto/firebase-auth.dto';

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private readonly organizationMemberRepository: Repository<OrganizationMemberEntity>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly firebase: FirebaseAdminService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const slug = await this.generateUniqueSlug(dto.organizationName);

    const result = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(UserEntity, {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
      });
      const savedUser = await manager.save(user);

      const organization = manager.create(OrganizationEntity, {
        name: dto.organizationName,
        slug,
      });
      const savedOrganization = await manager.save(organization);

      await manager.save(
        manager.create(OrganizationMemberEntity, {
          organizationId: savedOrganization.id,
          userId: savedUser.id,
          role: OrganizationRole.OWNER,
        }),
      );

      return { user: savedUser, organization: savedOrganization };
    });

    const token = this.signToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: OrganizationRole.OWNER,
    });

    return {
      accessToken: token,
      user: this.toPublicUser(result.user),
      organization: result.organization,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const memberships = await this.organizationMemberRepository.find({
      where: { userId: user.id },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });

    if (!memberships.length) {
      throw new UnauthorizedException('User is not assigned to an organization');
    }

    const membership = dto.organizationId
      ? memberships.find((m) => m.organizationId === dto.organizationId)
      : memberships[0];

    if (!membership) {
      throw new UnauthorizedException('User is not a member of the requested organization');
    }

    const token = this.signToken({
      userId: user.id,
      email: user.email,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    return {
      accessToken: token,
      user: this.toPublicUser(user),
      organization: membership.organization,
      role: membership.role,
      availableOrganizations: memberships.map((m) => ({
        id: m.organizationId,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  async firebaseLogin(idToken: string) {
    if (!this.firebase.isEnabled) {
      throw new ServiceUnavailableException('Firebase auth is not configured on this server');
    }

    const decoded = await this.firebase.verifyIdToken(idToken).catch(() => {
      throw new UnauthorizedException('Invalid Firebase ID token');
    });

    const email = decoded.email?.toLowerCase();
    if (!email) throw new UnauthorizedException('Firebase token has no email');

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('No OpsPilot account found for this email. Please register first.');
    }

    const memberships = await this.organizationMemberRepository.find({
      where: { userId: user.id },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });

    if (!memberships.length) {
      throw new UnauthorizedException('User is not assigned to an organization');
    }

    const membership = memberships[0];
    const token = this.signToken({
      userId: user.id,
      email: user.email,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    return {
      accessToken: token,
      user: this.toPublicUser(user),
      organization: membership.organization,
      role: membership.role,
      availableOrganizations: memberships.map((m) => ({
        id: m.organizationId,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  async firebaseRegister(dto: FirebaseRegisterDto) {
    if (!this.firebase.isEnabled) {
      throw new ServiceUnavailableException('Firebase auth is not configured on this server');
    }

    const decoded = await this.firebase.verifyIdToken(dto.idToken).catch(() => {
      throw new UnauthorizedException('Invalid Firebase ID token');
    });

    const email = decoded.email?.toLowerCase();
    if (!email) throw new UnauthorizedException('Firebase token has no email');

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered. Sign in instead.');
    }

    const slug = await this.generateUniqueSlug(dto.organizationName);

    const result = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(UserEntity, {
        email,
        name: dto.name || decoded.name || email.split('@')[0],
        passwordHash: '', // Firebase manages auth, no local password needed
      });
      const savedUser = await manager.save(user);

      const organization = manager.create(OrganizationEntity, {
        name: dto.organizationName,
        slug,
      });
      const savedOrganization = await manager.save(organization);

      await manager.save(
        manager.create(OrganizationMemberEntity, {
          organizationId: savedOrganization.id,
          userId: savedUser.id,
          role: OrganizationRole.OWNER,
        }),
      );

      return { user: savedUser, organization: savedOrganization };
    });

    const token = this.signToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: OrganizationRole.OWNER,
    });

    return {
      accessToken: token,
      user: this.toPublicUser(result.user),
      organization: result.organization,
    };
  }

  async getProfile(user: AuthenticatedUser) {
    const dbUser = await this.userRepository.findOne({ where: { id: user.userId } });
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    const memberships = await this.organizationMemberRepository.find({
      where: { userId: user.userId },
      relations: ['organization'],
      order: { createdAt: 'ASC' },
    });

    const activeOrganization = memberships.find((m) => m.organizationId === user.organizationId);

    return {
      user: this.toPublicUser(dbUser),
      activeOrganization: activeOrganization?.organization ?? null,
      role: user.role,
      organizations: memberships.map((membership) => ({
        ...membership.organization,
        role: membership.role,
      })),
    };
  }

  private signToken(input: {
    userId: string;
    email: string;
    organizationId: string;
    role: OrganizationRole;
  }) {
    return this.jwtService.sign({
      sub: input.userId,
      email: input.email,
      organizationId: input.organizationId,
      role: input.role,
    });
  }

  private toPublicUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
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
