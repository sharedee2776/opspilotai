import { OrganizationRole } from '../entities/organization-member.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
}
