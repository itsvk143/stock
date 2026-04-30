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
var MarketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const market_service_1 = require("./market.service");
let MarketGateway = MarketGateway_1 = class MarketGateway {
    redisService;
    marketService;
    server;
    logger = new common_1.Logger(MarketGateway_1.name);
    constructor(redisService, marketService) {
        this.redisService = redisService;
        this.marketService = marketService;
    }
    afterInit(server) {
        this.logger.log('Market Gateway Initialized');
        try {
            const subscriber = this.redisService.getSubscriber();
            if (!subscriber) {
                this.logger.error('Redis subscriber not initialized!');
                return;
            }
            subscriber.subscribe('market_ticks', (err) => {
                if (err) {
                    this.logger.error(`Redis subscribe error: ${err.message}`);
                }
            });
            subscriber.on('message', (channel, message) => {
                if (channel === 'market_ticks') {
                    try {
                        const data = JSON.parse(message);
                        this.server.emit(`tick:${data.token}`, data);
                    }
                    catch (e) {
                        this.logger.error(`Failed to parse market tick: ${e.message}`);
                    }
                }
            });
        }
        catch (error) {
            this.logger.error(`MarketGateway Redis init failed: ${error.message}`);
        }
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleSubscribe(client, tokens) {
        this.logger.log(`Client ${client.id} subscribing to: ${tokens}`);
        await this.marketService.subscribe(tokens);
    }
};
exports.MarketGateway = MarketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MarketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Array]),
    __metadata("design:returntype", Promise)
], MarketGateway.prototype, "handleSubscribe", null);
exports.MarketGateway = MarketGateway = MarketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        market_service_1.MarketService])
], MarketGateway);
//# sourceMappingURL=market.gateway.js.map