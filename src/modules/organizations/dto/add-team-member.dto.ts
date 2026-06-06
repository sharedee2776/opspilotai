import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { TeamRole } from '../../../common/entities/team-member.entity';

export class AddTeamMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}
