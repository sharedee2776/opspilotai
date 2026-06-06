import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SlackNotificationService } from './slack-notification.service';

@Module({
  imports: [ConfigModule],
  providers: [SlackNotificationService],
  exports: [SlackNotificationService],
})
export class SlackNotificationsModule {}
