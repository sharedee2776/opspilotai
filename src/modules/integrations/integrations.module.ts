import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationEntity } from '../../common/entities/integration.entity';
import { OrganizationMemberEntity } from '../../common/entities/organization-member.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationEntity, OrganizationMemberEntity])],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
