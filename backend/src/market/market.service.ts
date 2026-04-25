import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
const { SmartStreamV2 } = require('smartapi-javascript');

@Injectable()
export class MarketService implements OnModuleInit {
  private readonly logger = new Logger(MarketService.name);
  private ws: any;

  constructor(
    private authService: AuthService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // We'll initialize the WebSocket connection when the first client connects or on startup
    // For MVP, let's start it on startup if we have credentials
    try {
      // await this.initWebSocket();
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket on startup', error);
    }
  }

  async initWebSocket() {
    const session = await this.authService.getSession();
    const clientCode = this.configService.get('SMART_CLIENT_CODE');
    const apiKey = this.configService.get('SMART_API_KEY');

    this.ws = new SmartStreamV2({
      clientCode: clientCode,
      feedToken: session.feedToken,
      apiKey: apiKey,
      jwtToken: session.jwtToken,
    });

    this.ws.on('connect', () => {
      this.logger.log('Connected to SmartAPI WebSocket');
    });

    this.ws.on('tick', (tick: any) => {
      this.handleTick(tick);
    });

    this.ws.on('error', (error: any) => {
      this.logger.error('WebSocket Error', error);
    });

    this.ws.connect();
  }

  private handleTick(tick: any) {
    // Tick data structure depends on the mode
    // We broadcast it via Redis
    const token = tick.token;
    const ltp = tick.last_traded_price / 100; // Angel sends price in paisa
    
    const data = {
      token,
      ltp,
      change: tick.change,
      changePercent: tick.change_percent,
      timestamp: new Date(),
    };

    // Cache in Redis for quick access (LTP caching)
    this.redisService.set(`ltp:${token}`, data, 5); // 5 seconds TTL

    // Publish for real-time subscribers
    this.redisService.publish('market_ticks', data);
  }

  async subscribe(tokens: string[]) {
    if (!this.ws) await this.initWebSocket();
    
    this.ws.subscribe({
      correlationId: 'stock_intelligence',
      action: 1, // Subscribe
      mode: 1, // LTP Mode
      tokens: tokens.map(t => ({ exchangeType: 1, tokens: [t] })), // ExchangeType 1 = NSE
    });
  }

  async getLtp(exchange: string, tradingsymbol: string, symboltoken: string) {
    const cached = await this.redisService.get<any>(`ltp:${symboltoken}`);
    if (cached) return cached;

    const smartApi = this.authService.getSmartApiInstance();
    const response = await smartApi.getLtpData(exchange, tradingsymbol, symboltoken);
    
    if (response.status) {
      this.redisService.set(`ltp:${symboltoken}`, response.data, 60); // Cache for 1 min if not from WS
      return response.data;
    }
    throw new Error(response.message);
  }

  async getCandleData(exchange: string, symboltoken: string, interval: string, fromDate: string, toDate: string) {
    const smartApi = this.authService.getSmartApiInstance();
    const response = await smartApi.getCandleData({
      exchange,
      symboltoken,
      interval,
      fromdate: fromDate,
      todate: toDate,
    });

    if (response.status) {
      return response.data;
    }
    throw new Error(response.message);
  }
}
