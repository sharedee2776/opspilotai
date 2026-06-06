import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from '../../common/entities/alert.entity';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { DeduplicationService } from './services/deduplication.service';
import { AlertNormalizerService } from './services/alert-normalizer.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlertEntity])],
  controllers: [AlertsController],
  providers: [AlertsService, DeduplicationService, AlertNormalizerService],
  exports: [AlertsService, DeduplicationService, AlertNormalizerService],
})
export class AlertsModule {}
