import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../core/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      const pong = await this.redisService.ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'error';
    } catch {
      checks.redis = 'error';
    }

    const status = Object.values(checks).every((value) => value === 'ok') ? 'ok' : 'degraded';

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
