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
    // BullMQ 5 uses ioredis internally. ioredis does NOT support { url: '...' } as
    // a connection option — it silently falls back to localhost:6379 and crashes.
    // We must parse the URL into { host, port, password, ... } that ioredis accepts.
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        const parsed = new URL(redisUrl);
        const opts: Record<string, unknown> = {
          host: parsed.hostname,
          port: Number(parsed.port) || 6379,
        };
        if (parsed.password) opts.password = decodeURIComponent(parsed.password);
        if (parsed.username && parsed.username !== 'default') opts.username = parsed.username;
        const db = parsed.pathname?.replace('/', '');
        if (db) opts.db = Number(db);
        if (redisUrl.startsWith('rediss://')) opts.tls = {};
        return opts as ConnectionOptions;
      } catch {
        this.logger.warn('Failed to parse REDIS_URL for BullMQ, using localhost fallback');
      }
    }

    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.config.get<string>('REDIS_PORT', '6379'));
    const password = this.config.get<string>('REDIS_PASSWORD');
    const db = Number(this.config.get<string>('REDIS_DB', '0'));
    return { host, port, ...(password ? { password } : {}), db } as ConnectionOptions;
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
