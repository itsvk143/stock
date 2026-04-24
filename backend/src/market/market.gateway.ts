import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { MarketService } from './market.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MarketGateway.name);

  constructor(
    private redisService: RedisService,
    private marketService: MarketService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Market Gateway Initialized');
    
    // Subscribe to Redis ticks and broadcast to all clients
    const subscriber = this.redisService.getSubscriber();
    subscriber.subscribe('market_ticks');
    subscriber.on('message', (channel, message) => {
      if (channel === 'market_ticks') {
        const data = JSON.parse(message);
        this.server.emit(`tick:${data.token}`, data);
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_stock')
  async handleSubscribe(client: Socket, tokens: string[]) {
    this.logger.log(`Client ${client.id} subscribing to: ${tokens}`);
    await this.marketService.subscribe(tokens);
  }
}
