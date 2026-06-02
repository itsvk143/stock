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
    
    const subscribeToChannel = async () => {
      try {
        if (subscriber.status === 'ready') {
          this.logger.log('Subscribing to market_ticks...');
          await subscriber.subscribe('market_ticks');
          this.logger.log('Successfully subscribed to market_ticks channel');
        } else {
          this.logger.warn(`Cannot subscribe to market_ticks, subscriber status is: ${subscriber.status}`);
        }
      } catch (err) {
        this.logger.error(`Redis subscribe error: ${err.message}`);
        // If still ready, retry after a delay
        if (subscriber.status === 'ready') {
          setTimeout(() => subscribeToChannel(), 5000);
        }
      }
    };

    // Subscribe when the client becomes ready (on initial connection and after successful reconnects)
    subscriber.on('ready', () => {
      this.logger.log('Redis subscriber connected/reconnected');
      subscribeToChannel();
    });

    // If already ready, subscribe immediately
    if (subscriber.status === 'ready') {
      subscribeToChannel();
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
    // await this.marketService.subscribe(tokens);
  }
}
