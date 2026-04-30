import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    const redisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: 10,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        return Math.min(times * 500, 3000);
      },
    };

    if (redisUrl) {
      this.client = new Redis(redisUrl, redisOptions);
      this.subscriber = new Redis(redisUrl, redisOptions);
    } else {
      this.client = new Redis({ host, port, ...redisOptions });
      this.subscriber = new Redis({ host, port, ...redisOptions });
    }

    // Prevent unhandled errors from crashing the app
    this.client.on('error', (err) => console.error('Redis client error:', err.message));
    this.subscriber.on('error', (err) => console.error('Redis subscriber error:', err.message));
  }

  async onModuleInit() {
    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
      ]);
    } catch (err) {
      console.error('Redis initialization failed:', err.message);
    }
  }

  onModuleDestroy() {
    this.client.quit();
    this.subscriber.quit();
  }

  async set(key: string, value: any, ttl?: number) {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, stringValue, 'EX', ttl);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string) {
    await this.client.del(key);
  }

  getClient(): Redis {
    return this.client;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  async publish(channel: string, message: any) {
    await this.client.publish(channel, JSON.stringify(message));
  }
}
