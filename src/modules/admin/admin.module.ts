import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from '../../common/entities/alert.entity';
import { IncidentEntity } from '../../common/entities/incident.entity';
import { IntegrationEntity } from '../../common/entities/integration.entity';
import { OrganizationMemberEntity } from '../../common/entities/organization-member.entity';
import { OrganizationEntity } from '../../common/entities/organization.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserEntity,
      OrganizationEntity,
      OrganizationMemberEntity,
      IncidentEntity,
      AlertEntity,
      IntegrationEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
