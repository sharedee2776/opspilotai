import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { OrganizationRole } from '../../../common/entities/organization-member.entity';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn([OrganizationRole.ADMIN, OrganizationRole.MEMBER])
  role?: OrganizationRole;
}
