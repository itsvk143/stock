"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MarketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const redis_service_1 = require("../redis/redis.service");
const config_1 = require("@nestjs/config");
const smartapi_javascript_1 = require("smartapi-javascript");
let MarketService = MarketService_1 = class MarketService {
    authService;
    redisService;
    configService;
    logger = new common_1.Logger(MarketService_1.name);
    ws;
    constructor(authService, redisService, configService) {
        this.authService = authService;
        this.redisService = redisService;
        this.configService = configService;
    }
    async onModuleInit() {
        try {
        }
        catch (error) {
            this.logger.error('Failed to initialize WebSocket on startup', error);
        }
    }
    async initWebSocket() {
        const session = await this.authService.getSession();
        const clientCode = this.configService.get('SMART_CLIENT_CODE');
        const apiKey = this.configService.get('SMART_API_KEY');
        this.ws = new smartapi_javascript_1.SmartStreamV2({
            clientCode: clientCode,
            feedToken: session.feedToken,
            apiKey: apiKey,
            jwtToken: session.jwtToken,
        });
        this.ws.on('connect', () => {
            this.logger.log('Connected to SmartAPI WebSocket');
        });
        this.ws.on('tick', (tick) => {
            this.handleTick(tick);
        });
        this.ws.on('error', (error) => {
            this.logger.error('WebSocket Error', error);
        });
        this.ws.connect();
    }
    handleTick(tick) {
        const token = tick.token;
        const ltp = tick.last_traded_price / 100;
        const data = {
            token,
            ltp,
            change: tick.change,
            changePercent: tick.change_percent,
            timestamp: new Date(),
        };
        this.redisService.set(`ltp:${token}`, data, 5);
        this.redisService.publish('market_ticks', data);
    }
    async subscribe(tokens) {
        if (!this.ws)
            await this.initWebSocket();
        this.ws.subscribe({
            correlationId: 'stock_intelligence',
            action: 1,
            mode: 1,
            tokens: tokens.map(t => ({ exchangeType: 1, tokens: [t] })),
        });
    }
    async getLtp(exchange, tradingsymbol, symboltoken) {
        const cached = await this.redisService.get(`ltp:${symboltoken}`);
        if (cached)
            return cached;
        const smartApi = this.authService.getSmartApiInstance();
        const response = await smartApi.getLtpData(exchange, tradingsymbol, symboltoken);
        if (response.status) {
            this.redisService.set(`ltp:${symboltoken}`, response.data, 60);
            return response.data;
        }
        throw new Error(response.message);
    }
    async getCandleData(exchange, symboltoken, interval, fromDate, toDate) {
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
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = MarketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        redis_service_1.RedisService,
        config_1.ConfigService])
], MarketService);
//# sourceMappingURL=market.service.js.map