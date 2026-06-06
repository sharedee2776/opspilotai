import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { RedisService } from '../../../core/redis/redis.service';
import { AlertEntity } from '../../../common/entities/alert.entity';

@Injectable()
export class DeduplicationService {
  constructor(
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  generateDedupHash(payload: Record<string, any>): string {
    const normalized = `${String(payload.service || '').trim().toLowerCase()}:${String(
      payload.title || '',
    )
      .trim()
      .toLowerCase()}`;

    return createHash('sha256').update(normalized).digest('hex');
  }

  async isDuplicate(dedupHash: string): Promise<boolean> {
    const windowMinutes = Number(this.config.get<string>('ALERT_DEDUP_WINDOW_MINUTES', '5'));
    const ttlSeconds = windowMinutes * 60;
    const since = new Date(Date.now() - ttlSeconds * 1000);

    const existing = await this.alertRepository.findOne({
      where: { dedupHash, createdAt: MoreThan(since) },
    });
    if (existing) {
      return true;
    }

    const acquired = await this.redisService.getClient().set(`dedup:${dedupHash}`, '1', {
      EX: ttlSeconds,
      NX: true,
    });

    return acquired === null;
  }
}
