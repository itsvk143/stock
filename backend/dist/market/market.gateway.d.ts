import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { MarketService } from './market.service';
export declare class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private redisService;
    private marketService;
    server: Server;
    private readonly logger;
    constructor(redisService: RedisService, marketService: MarketService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, tokens: string[]): Promise<void>;
}
