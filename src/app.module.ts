import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { QueueModule } from './core/queue/queue.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AiModule } from './modules/ai/ai.module';
import { SlackModule } from './modules/slack/slack.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    AlertsModule,
    IncidentsModule,
    AiModule,
    SlackModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule {}
