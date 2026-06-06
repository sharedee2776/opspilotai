import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsModule } from '../../modules/alerts/alerts.module';
import { IncidentsModule } from '../../modules/incidents/incidents.module';
import { AiModule } from '../../modules/ai/ai.module';
import { SlackNotificationsModule } from '../../modules/slack/slack-notifications.module';
import { QueueProducerService } from './queue-producer.service';
import {
  AiAnalysisProcessor,
  AlertProcessor,
  IncidentProcessor,
} from './processors/alert-pipeline.processors';

@Global()
@Module({
  imports: [ConfigModule, AlertsModule, IncidentsModule, AiModule, SlackNotificationsModule],
  providers: [
    QueueProducerService,
    AlertProcessor,
    IncidentProcessor,
    AiAnalysisProcessor,
  ],
  exports: [QueueProducerService],
})
export class QueueModule {}
