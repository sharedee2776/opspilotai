import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationMemberEntity } from '../../common/entities/organization-member.entity';
import { OrganizationEntity } from '../../common/entities/organization.entity';
import { TeamMemberEntity } from '../../common/entities/team-member.entity';
import { TeamEntity } from '../../common/entities/team.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationEntity,
      OrganizationMemberEntity,
      TeamEntity,
      TeamMemberEntity,
      UserEntity,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
