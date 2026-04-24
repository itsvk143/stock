import { OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
export declare class MarketService implements OnModuleInit {
    private authService;
    private redisService;
    private configService;
    private readonly logger;
    private ws;
    constructor(authService: AuthService, redisService: RedisService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    initWebSocket(): Promise<void>;
    private handleTick;
    subscribe(tokens: string[]): Promise<void>;
    getLtp(exchange: string, tradingsymbol: string, symboltoken: string): Promise<any>;
    getCandleData(exchange: string, symboltoken: string, interval: string, fromDate: string, toDate: string): Promise<any>;
}
