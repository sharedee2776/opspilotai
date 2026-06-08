import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { DatadogController } from './datadog.controller';
import { DatadogNormalizerService } from './datadog-normalizer.service';
import { DatadogService } from './datadog.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [DatadogController],
  providers: [DatadogNormalizerService, DatadogService],
  exports: [DatadogNormalizerService, DatadogService],
})
export class DatadogModule {}
