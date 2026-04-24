import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private client;
    private subscriber;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    getClient(): Redis;
    getSubscriber(): Redis;
    publish(channel: string, message: any): Promise<void>;
}
