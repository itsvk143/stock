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
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
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
    const subscriber = this.redisService.getSubscriber();
    
    const doSubscribe = () => {
      this.logger.log('Redis ready, subscribing to market_ticks...');
      subscriber.subscribe('market_ticks', (err) => {
        if (err) {
          this.logger.error(`Redis subscribe error: ${err.message}`);
          setTimeout(() => doSubscribe(), 5000);
        } else {
          this.logger.log('Successfully subscribed to market_ticks channel');
        }
      });
    };

    if (subscriber.status === 'ready') {
      doSubscribe();
    } else {
      subscriber.once('ready', () => doSubscribe());
    }

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
