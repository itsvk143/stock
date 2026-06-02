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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MarketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let MarketService = MarketService_1 = class MarketService {
    configService;
    logger = new common_1.Logger(MarketService_1.name);
    dataLayerUrl;
    constructor(configService) {
        this.configService = configService;
        this.dataLayerUrl = this.configService.get('DATA_LAYER_URL', 'http://localhost:8001');
    }
    async getLtp(symbol) {
        try {
            const response = await axios_1.default.get(`${this.dataLayerUrl}/stock/${symbol}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Data Layer error for ${symbol}: ${error.message}`);
            throw new Error(`Failed to fetch stock data for ${symbol}`);
        }
    }
    async getCandleData(exchange, symboltoken, interval, fromDate, toDate) {
        this.logger.warn('getCandleData not yet migrated to Data Layer');
        return [];
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = MarketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MarketService);
//# sourceMappingURL=market.service.js.map