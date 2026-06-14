import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { CloudWatchController } from './cloudwatch.controller';
import { CloudWatchNormalizerService } from './cloudwatch-normalizer.service';
import { CloudWatchService } from './cloudwatch.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [CloudWatchController],
  providers: [CloudWatchService, CloudWatchNormalizerService],
})
export class CloudWatchModule {}
