import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import type { ConnectionOptions } from 'bullmq';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.buildRedisUrl();
    this.client = createClient({ url });

    this.client.on('error', (error) => {
      this.logger.error('Redis client error', error);
    });

    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  getBullMqConnection(): ConnectionOptions {
    const url = this.buildRedisUrl();
    return { url };
  }

  async ping(): Promise<string> {
    return this.getClient().ping();
  }

  private buildRedisUrl(): string {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      return redisUrl;
    }

    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<string>('REDIS_PORT', '6379');
    const password = this.config.get<string>('REDIS_PASSWORD');
    const db = this.config.get<string>('REDIS_DB', '0');

    if (password) {
      return `redis://:${encodeURIComponent(password)}@${host}:${port}/${db}`;
    }

    return `redis://${host}:${port}/${db}`;
  }
}
