import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEntity } from '../../common/entities/alert.entity';
import { IncidentEntity } from '../../common/entities/incident.entity';
import { ActionEntity } from '../../common/entities/action.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const entities = [AlertEntity, IncidentEntity, ActionEntity];
        const common = {
          entities,
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('DB_LOGGING') === 'true',
        };

        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          console.log('[Database] Using DATABASE_URL for connection');
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            ...common,
          };
        }

        const host = config.get<string>('DB_HOST', 'localhost');
        const port = Number(config.get<number>('DB_PORT', 5432));
        console.log(`[Database] Connecting to ${host}:${port}`);

        if (host === 'localhost' && config.get<string>('NODE_ENV') === 'production') {
          console.warn(
            '[Database] DB_HOST is localhost in production. Add a Railway Postgres service and set DATABASE_URL=${{Postgres.DATABASE_URL}}',
          );
        }

        return {
          type: 'postgres' as const,
          host,
          port,
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_NAME', 'opspilot_dev'),
          ...common,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
