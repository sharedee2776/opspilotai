import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsModule } from '../integrations/integrations.module';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';

@Module({
  imports: [ConfigModule, IntegrationsModule],
  controllers: [SlackController],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule {}
