import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from '../../common/entities/alert.entity';
import { ActionEntity } from '../../common/entities/action.entity';
import { IncidentEntity } from '../../common/entities/incident.entity';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentBuilderService } from './services/incident-builder.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncidentEntity, AlertEntity, ActionEntity]),
    AiModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentBuilderService],
  exports: [IncidentsService, IncidentBuilderService],
})
export class IncidentsModule {}
