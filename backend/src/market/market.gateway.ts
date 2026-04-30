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
    this.setupRedisSubscription();
  }

  private setupRedisSubscription() {
    try {
      const subscriber = this.redisService.getSubscriber();
      if (!subscriber) {
        this.logger.error('Redis subscriber not initialized!');
        return;
      }

      subscriber.subscribe('market_ticks', (err) => {
        if (err) {
          this.logger.error(`Redis subscribe error: ${err.message}`);
          // Retry subscription after 5 seconds if it fails
          setTimeout(() => this.setupRedisSubscription(), 5000);
        } else {
          this.logger.log('Successfully subscribed to market_ticks channel');
        }
      });

      subscriber.on('message', (channel, message) => {
        if (channel === 'market_ticks') {
          try {
            const data = JSON.parse(message);
            this.server.emit(`tick:${data.token}`, data);
          } catch (e) {
            this.logger.error(`Failed to parse market tick: ${e.message}`);
          }
        }
      });
    } catch (error) {
      this.logger.error(`MarketGateway Redis setup failed: ${error.message}`);
    }
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
